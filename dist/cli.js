#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _index = require('./index');

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _yargs$usage$example$ = _yargs2.default.usage('Usage: httpsrv <basedir>').example('httpsrv . -p 8888', 'Start server on port 8888').demandCommand(1).option('port', {
	alias: 'p',
	default: 3333,
	type: 'number',
	describe: 'Port to listen'
}).option('log', {
	alias: 'l',
	type: 'boolean',
	describe: 'Enable logger'
}).option('showdotfile', {
	alias: 'd',
	type: 'boolean',
	describe: 'Show files starts with dot in directory page.'
}).option('indexhtml', {
	alias: 'i',
	type: 'boolean',
	describe: 'Try to show index.html if exists'
}).option('upload', {
	alias: 'u',
	type: 'boolean',
	default: false,
	describe: 'enable fileupload in directory page'
}).option('noinstantclick', {
	alias: 'x',
	type: 'boolean',
	default: false,
	describe: 'disable instantclick.js in directory page'
}).option('cors', {
	alias: 'c',
	type: 'string',
	describe: 'Access-Control-Allow-Origin header'
}).option('fallback', {
	alias: 'f',
	type: 'string',
	describe: 'A file will be send when 404, useful in SPA (will disable directory listing page)'
}).option('auth', {
	alias: 'a',
	type: 'string',
	describe: 'Http basic auth, format: username:password'
}).argv,
    _yargs$usage$example$2 = _slicedToArray(_yargs$usage$example$._, 1),
    basedir = _yargs$usage$example$2[0],
    port = _yargs$usage$example$.port,
    log = _yargs$usage$example$.log,
    showdotfile = _yargs$usage$example$.showdotfile,
    cors = _yargs$usage$example$.cors,
    fallback = _yargs$usage$example$.fallback,
    indexhtml = _yargs$usage$example$.indexhtml,
    noinstantclick = _yargs$usage$example$.noinstantclick,
    upload = _yargs$usage$example$.upload,
    auth = _yargs$usage$example$.auth;

var path = require('path');
(0, _index.createServer)({
	basedir: path.isAbsolute(basedir) ? basedir : path.join(process.cwd(), basedir),
	log: log,
	showdotfile: showdotfile,
	cors: cors,
	fallback: fallback,
	indexhtml: indexhtml,
	instantclick: !noinstantclick,
	upload: upload,
	auth: auth
}).listen(port, function (_) {
	return console.log('listen on http://localhost:' + port);
});