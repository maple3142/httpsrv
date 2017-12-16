#!/usr/bin/env node
const createServer = require('./index')

const [basedir, port = 3333] = process.argv.slice(2)
if (!basedir) console.log('fileserver <basedir> [port=3333]'), process.exit()

createServer({ basedir, port, log: true, cors: true }).then(_ => console.log(`listen on *:${port}`))