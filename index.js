const express = require('express')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { Promise } = require('bluebird')
global.Promise = Promise
const pfs = Promise.promisifyAll(fs)

function createServer({ basedir, log, cors, fallback, indexhtml, instantclick }) {
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
				const file = path.join( basedir, decodeURIComponent(req.path))
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
		const file = path.join(basedir, decodeURIComponent(req.path))

		try {
			const stat = await pfs.statAsync(file)
			if (!stat.isFile()) { //file not found
				if (fallback) pfs.createReadStream(fallbackfile).pipe(res) //if fallback exists, send it instead
				else if (stat.isDirectory()) { //if is directory, display it
					const filelist = await pfs.readdirAsync(file)
					const statlist = await Promise.all(filelist.map(f => pfs.statAsync(path.join(file, f))))
					let list = []
					for (let i = 0; i < filelist.length; i++) {
						list.push({
							name: filelist[i],
							stat: statlist[i]
						})
					}
					res.set('Content-Type', 'text/html').send(renderDirectory(list, req.path))
				}
				else res.status(404).send('404 NOT FOUND')
			}
			else { //file found
				res.set('Content-Type', mime.getType(req.path))
				res.set('Content-Length', stat.size)
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
		return `<h1>${curpath}</h1>`
			+ `<a href="${path.join(curpath, '../')}">../</a><br>`
			+ list.sort(file => file.stat.isFile()).map(file => `<a href="${path.join(curpath, file.name)}" ${file.stat.isFile() ? 'target="_blank"' : ''}>${file.name} ${file.stat.isDirectory() ? '<small>&#128193;</small>' : ''}</a>`).join('<br>')
			+ (instantclick ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/instantclick/3.0.1/instantclick.min.js" data-no-instant></script><script data-no-instant>InstantClick.init()</script>' : '')
	}

	return app
}
module.exports = createServer