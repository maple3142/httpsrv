const express = require('express')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { Promise } = require('bluebird')
global.Promise = Promise
const pfs = Promise.promisifyAll(fs)

function createServer({ basedir, port, log, cors }) {
	return new Promise((res, rej) => {
		const app = express()
		//logger & cors
		app.use((req, res, next) => {
			if (log) console.log(`${req.method} ${decodeURIComponent(req.path)}`)
			if (cors) res.set('Access-Control-Allow-Origin', cors)
			next()
		})
		app.get('*', async (req, res) => {
			const file = path.join(process.cwd(), basedir, decodeURIComponent(req.path))

			try {
				const stat = await pfs.statAsync(file)
				if (!stat.isFile()) { //file not found
					if (stat.isDirectory()) res.set('Content-Type','text/html').send(renderDirectory(await pfs.readdirAsync(file), req.path)) //if is directory, display it
					else res.status(404).send('404 NOT FOUND')
				}
				else { //file found
					res.set('Content-Type', mime.getType(req.path))
					pfs.createReadStream(file).pipe(res)
				}
			}
			catch (err) {
				if (err.code === 'ENOENT') res.status(404).send('404 NOT FOUND')
				else res.status(500).send('500 SERVER ERROR')
			}
		})
		app.listen(port, _ => res(app)) //listen on trigger callback

		function renderDirectory(list, curpath) { //directory renderer
			return `<h1>${curpath}</h1>` + list.map(file => `<a href="${path.join(curpath, file)}">${file}</a>`).join('<br>')
		}
	})
}
module.exports = createServer