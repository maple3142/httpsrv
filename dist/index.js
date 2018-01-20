'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.createServer = createServer;

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _basicAuth = require('basic-auth');

var _basicAuth2 = _interopRequireDefault(_basicAuth);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('bluebird'),
    Promise = _require.Promise;

global.Promise = Promise;
var pfs = Promise.promisifyAll(_fs2.default);

function createServer(_ref) {
	var basedir = _ref.basedir,
	    log = _ref.log,
	    cors = _ref.cors,
	    fallback = _ref.fallback,
	    indexhtml = _ref.indexhtml,
	    instantclick = _ref.instantclick,
	    upload = _ref.upload,
	    auth = _ref.auth;

	var fallbackfile = _path2.default.join(basedir, decodeURIComponent(fallback));
	var app = (0, _express2.default)();
	app.set('view engine', 'pug');
	app.set('views', _path2.default.join(__dirname, '../views'));
	var storage = _multer2.default.diskStorage({
		destination: function destination(req, file, cb) {
			var dest = _path2.default.resolve(_path2.default.join(basedir, req.url));
			(0, _mkdirp2.default)(dest, function (err) {
				if (err) throw err;else cb(null, dest);
			});
		},
		filename: function filename(req, file, cb) {
			cb(null, file.originalname);
		}
	});
	var mu = (0, _multer2.default)({ storage: storage });

	if (auth) {
		var _auth$split = auth.split(':'),
		    _auth$split2 = _slicedToArray(_auth$split, 2),
		    username = _auth$split2[0],
		    password = _auth$split2[1];

		if (!username || !password) {
			throw new Error('Please provide a correct auth string "username:password"');
		}
		app.use(function (req, res, next) {
			var cdt = (0, _basicAuth2.default)(req);
			if (cdt && cdt.name === username && cdt.pass === password) next();else {
				res.set('WWW-Authenticate', 'Basic realm="httpsrv authentication"').status(401).send('Access denied');
			}
		});
	}

	//logger & cors
	if (log || cors) {
		app.use(function (req, res, next) {
			if (log) console.log(req.method + ' ' + decodeURIComponent(req.path));
			if (cors) res.set('Access-Control-Allow-Origin', cors);
			next();
		});
	}
	if (indexhtml) {
		app.get('*', async function (req, res, next) {
			//serve index.html if exists
			try {
				var file = _path2.default.join(basedir, decodeURIComponent(req.path));
				var stat = await pfs.statAsync(file);
				if (stat.isDirectory()) {
					//if current path is directory
					var file2 = _path2.default.join(basedir, decodeURIComponent(req.path), 'index.html');
					var stat2 = await pfs.statAsync(file2); //try to detect index.html under current path
					if (stat2.isFile()) {
						res.set('Content-Type', 'text/html');
						res.set('Content-Length', stat2.size);
						pfs.createReadStream(file2).pipe(res);
					} else next();
				} else next();
			} catch (err) {
				next();
			}
		});
	}
	app.get('*', showDirectory);
	if (upload) app.post('*', mu.single('file'), showDirectory);
	async function showDirectory(req, res) {
		var file = _path2.default.join(basedir, decodeURIComponent(req.path));

		try {
			var stat = await pfs.statAsync(file);
			if (!stat.isFile()) {
				//file not found
				if (fallback) pfs.createReadStream(fallbackfile).pipe(res);else if (stat.isDirectory()) {
					//if fallback exists, send it instead
					//if is directory, display it
					var filelist = await pfs.readdirAsync(file);
					var statlist = await Promise.all(filelist.map(function (f) {
						return pfs.statAsync(_path2.default.join(file, f));
					}));
					var list = [];
					for (var i = 0; i < filelist.length; i++) {
						list.push({
							name: filelist[i],
							stat: statlist[i]
						});
					}
					res.render('directory', {
						list: list,
						path: _path2.default,
						instantclick: instantclick,
						upload: upload,
						curpath: req.path
					});
				} else res.status(404).send('404 NOT FOUND');
			} else {
				//file found
				res.set('Content-Type', _mime2.default.getType(req.path));
				res.set('Content-Length', stat.size);
				pfs.createReadStream(file).pipe(res);
			}
		} catch (err) {
			if (fallback) pfs.createReadStream(fallbackfile).pipe(res);else if (err.code === 'ENOENT')
				//if fallback exists
				res.status(404).send('404 NOT FOUND'); //file not found
			else res.status(500).send('500 SERVER ERROR');
		}
	}

	return app;
}