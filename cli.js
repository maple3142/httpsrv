#!/usr/bin/env node
const createServer = require('./index')
const { _: [basedir], port, log, cors, fallback, indexhtml } = require('yargs')
	.usage('Usage: $0 <basedir>')
	.example('$0 . -p 8888', 'Start server on port 8888')
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
	.options('cors', {
		alias: 'c',
		type: 'string',
		describe: 'Access-Control-Allow-Origin header'
	})
	.option('fallback', {
		alias: 'f',
		type: 'string',
		describe: 'A file will be send when 404, useful in SPA'
	})
	.option('indexhtml', {
		alias: 'i',
		type: 'boolean',
		describe: 'Try to show index.html if exists'
	}).argv

createServer({ basedir, log, cors, fallback, indexhtml }).listen(port, _ => console.log(`listen on *:${port}`))