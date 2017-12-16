const express = require('express')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { Promise } = require('bluebird')
global.Promise = Promise
const pfs = Promise.promisifyAll(fs)

function createServer({ basedir, log, cors, fallback, indexhtml }) {
	const fallbackfile = path.join(process.cwd(), basedir, decodeURIComponent(fallback))
	const app = express()
	//logger & cors
	app.use((req, res, next) => {
		if (log) console.log(`${req.method} ${decodeURIComponent(req.path)}`)
		if (cors) res.set('Access-Control-Allow-Origin', cors)
		next()
	})
	app.use(async (req, res, next) => { //serve index.html if needed && possible
		if (!indexhtml) next()
		else {
			try {
				const file = path.join(process.cwd(), basedir, decodeURIComponent(req.path))
				const stat = await pfs.statAsync(file)
				if (stat.isDirectory()) { //if current path is directory
					const file2 = path.join(process.cwd(), basedir, path.join(decodeURIComponent(req.path), 'index.html'))
					const stat2 = await pfs.statAsync(file2) //try to detect index.html under current path
					if (stat2.isFile()) pfs.createReadStream(file2).pipe(res)
				}
				else next()
			}
			catch (err) {
				next()
			}
		}
	})
	app.get('*', async (req, res) => {
		const file = path.join(process.cwd(), basedir, decodeURIComponent(req.path))

		try {
			const stat = await pfs.statAsync(file)
			if (!stat.isFile()) { //file not found
				if (fallback) pfs.createReadStream(fallbackfile).pipe(res) //if fallback exists, send it instead
				else if (stat.isDirectory()) res.set('Content-Type', 'text/html').send(renderDirectory(await pfs.readdirAsync(file), req.path)) //if is directory, display it
				else res.status(404).send('404 NOT FOUND')
			}
			else { //file found
				res.set('Content-Type', mime.getType(req.path))
				pfs.createReadStream(file).pipe(res)
			}
		}
		catch (err) {
			if (fallback) pfs.createReadStream(fallbackfile).pipe(res) //if fallback exists
			else if (err.code === 'ENOENT') res.status(404).send('404 NOT FOUND') //file not found
			else res.status(500).send('500 SERVER ERROR')
		}
	})

	function renderDirectory(list, curpath) { //directory renderer
		return `<h1>${curpath}</h1>` + list.map(file => `<a href="${path.join(curpath, file)}">${file}</a>`).join('<br>')
	}

	return app
}
module.exports = createServer