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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('bluebird'),
    Promise = _require.Promise;

global.Promise = Promise;
var pfs = Promise.promisifyAll(_fs2.default);

function createServer(_ref) {
	var _this = this;

	var showDirectory = function () {
		var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
			var file, stat, filelist, statlist, list, i;
			return regeneratorRuntime.wrap(function _callee2$(_context2) {
				while (1) {
					switch (_context2.prev = _context2.next) {
						case 0:
							file = _path2.default.join(basedir, decodeURIComponent(req.path));
							_context2.prev = 1;
							_context2.next = 4;
							return pfs.statAsync(file);

						case 4:
							stat = _context2.sent;

							if (stat.isFile()) {
								_context2.next = 25;
								break;
							}

							if (!fallback) {
								_context2.next = 10;
								break;
							}

							pfs.createReadStream(fallbackfile).pipe(res);
							_context2.next = 23;
							break;

						case 10:
							if (!stat.isDirectory()) {
								_context2.next = 22;
								break;
							}

							_context2.next = 13;
							return pfs.readdirAsync(file);

						case 13:
							filelist = _context2.sent;
							_context2.next = 16;
							return Promise.all(filelist.map(function (f) {
								return pfs.statAsync(_path2.default.join(file, f));
							}));

						case 16:
							statlist = _context2.sent;
							list = [];

							for (i = 0; i < filelist.length; i++) {
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
							_context2.next = 23;
							break;

						case 22:
							res.status(404).send('404 NOT FOUND');

						case 23:
							_context2.next = 28;
							break;

						case 25:
							//file found
							res.set('Content-Type', _mime2.default.getType(req.path));
							res.set('Content-Length', stat.size);
							pfs.createReadStream(file).pipe(res);

						case 28:
							_context2.next = 33;
							break;

						case 30:
							_context2.prev = 30;
							_context2.t0 = _context2['catch'](1);

							if (fallback) pfs.createReadStream(fallbackfile).pipe(res);else if (_context2.t0.code === 'ENOENT')
								//if fallback exists
								res.status(404).send('404 NOT FOUND'); //file not found
							else res.status(500).send('500 SERVER ERROR');

						case 33:
						case 'end':
							return _context2.stop();
					}
				}
			}, _callee2, this, [[1, 30]]);
		}));

		return function showDirectory(_x4, _x5) {
			return _ref3.apply(this, arguments);
		};
	}();

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
		app.get('*', function () {
			var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res, next) {
				var file, stat, file2, stat2;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_context.prev = 0;
								file = _path2.default.join(basedir, decodeURIComponent(req.path));
								_context.next = 4;
								return pfs.statAsync(file);

							case 4:
								stat = _context.sent;

								if (!stat.isDirectory()) {
									_context.next = 13;
									break;
								}

								//if current path is directory
								file2 = _path2.default.join(basedir, decodeURIComponent(req.path), 'index.html');
								_context.next = 9;
								return pfs.statAsync(file2);

							case 9:
								stat2 = _context.sent;
								//try to detect index.html under current path
								if (stat2.isFile()) {
									res.set('Content-Type', 'text/html');
									res.set('Content-Length', stat2.size);
									pfs.createReadStream(file2).pipe(res);
								} else next();
								_context.next = 14;
								break;

							case 13:
								next();

							case 14:
								_context.next = 19;
								break;

							case 16:
								_context.prev = 16;
								_context.t0 = _context['catch'](0);

								next();

							case 19:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, _this, [[0, 16]]);
			}));

			return function (_x, _x2, _x3) {
				return _ref2.apply(this, arguments);
			};
		}());
	}
	app.get('*', showDirectory);
	if (upload) app.post('*', mu.single('file'), showDirectory);


	return app;
}