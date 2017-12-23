#!/usr/bin/env node
const createServer = require('./index')
const { _: [basedir], port, log, cors, fallback, indexhtml, instantclick } = require('yargs')
	.usage('Usage: httpsrv <basedir>')
	.example('httpsrv . -p 8888', 'Start server on port 8888')
	.demandCommand(1)
	.options('port', {
		alias: 'p',
		default: 3333,
		type: 'number',
		describe: 'Port to listen'
	})
	.options('log', {
		alias: 'l',
		type: 'boolean',
		describe: 'Enable logger'
	})
	.option('indexhtml', {
		alias: 'i',
		type: 'boolean',
		describe: 'Try to show index.html if exists'
	})
	.option('instantclick', {
		alias: 'x',
		type: 'boolean',
		default: true,
		describe: 'disable instantclick.js in directory page'
	})
	.options('cors', {
		alias: 'c',
		type: 'string',
		describe: 'Access-Control-Allow-Origin header'
	})
	.option('fallback', {
		alias: 'f',
		type: 'string',
		describe: 'A file will be send when 404, useful in SPA (will disable directory listing page)'
	})
	.argv
const path = require('path')
createServer({ basedir: path.isAbsolute(basedir) ? basedir : path.join(process.cwd(), basedir), log, cors, fallback, indexhtml, instantclick }).listen(port, _ => console.log(`listen on *:${port}`))