const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const mkdirp = require('mkdirp')
const { Promise } = require('bluebird')
global.Promise = Promise
const pfs = Promise.promisifyAll(fs)

function createServer({ basedir, log, cors, fallback, indexhtml, instantclick, upload }) {
	const fallbackfile = path.join(process.cwd(), basedir, decodeURIComponent(fallback))
	const app = express()
	app.set('view engine', 'pug')
	const storage = multer.diskStorage({
		destination(req, file, cb) {
			mkdirp(path.resolve(path.join(process.cwd(), req.url)), err => {
				if (err) throw err
				else cb(null, path.resolve(path.join(process.cwd(), req.url)))
			})
		},
		filename(req, file, cb) {
			cb(null, file.originalname)
		}
	})
	const mu = multer({ storage })

	//logger & cors
	app.use((req, res, next) => {
		if (log) console.log(`${req.method} ${decodeURIComponent(req.path)}`)
		if (cors) res.set('Access-Control-Allow-Origin', cors)
		next()
	})
	app.get(async (req, res, next) => { //serve index.html if needed && possible
		if (!indexhtml) next()
		else {
			try {
				const file = path.join(basedir, decodeURIComponent(req.path))
				const stat = await pfs.statAsync(file)
				if (stat.isDirectory()) { //if current path is directory
					const file2 = path.join(basedir, decodeURIComponent(req.path), 'index.html')
					const stat2 = await pfs.statAsync(file2) //try to detect index.html under current path
					if (stat2.isFile()) {
						res.set('Content-Type', 'text/html')
						res.set('Content-Length', stat2.size)
						pfs.createReadStream(file2).pipe(res)
					}
				}
				else next()
			}
			catch (err) {
				next()
			}
		}
	})
	app.get('*', showDirectory)
	if (upload) app.post('*', mu.single('file'), showDirectory)
	async function showDirectory(req, res) {
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
					res.render('directory', {
						list,
						path,
						instantclick,
						upload,
						curpath: req.path
					})
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
	}

	return app
}
module.exports = createServer