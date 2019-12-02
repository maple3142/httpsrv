import express from 'express'
import multer from 'multer'
import bauth from 'basic-auth'
import fs from 'fs'
import path from 'path'
import url from 'url'
import mime from 'mime'
import mkdirp from 'mkdirp'
import parseRange from 'range-parser'
import { pbkdf2 } from 'crypto'
const { Promise } = require('bluebird')
global.Promise = Promise
const pfs = Promise.promisifyAll(fs)

export function createServer({
	basedir,
	log,
	showdotfile,
	cors,
	fallback,
	indexhtml,
	instantclick,
	upload,
	auth
}) {
	const fallbackfile = path.join(basedir, decodeURIComponent(fallback))
	const app = express()
	app.set('view engine', 'pug')
	app.set('views', path.join(__dirname, '../views'))
	const storage = multer.diskStorage({
		destination(req, file, cb) {
			const dest = path.resolve(path.join(basedir, req.url))
			mkdirp(dest, err => {
				if (err) throw err
				else cb(null, dest)
			})
		},
		filename(req, file, cb) {
			cb(null, file.originalname)
		}
	})
	const mu = multer({ storage })

	if (auth) {
		const [username, password] = auth.split(':')
		if (!username || !password) {
			throw new Error(
				'Please provide a correct auth string "username:password"'
			)
		}
		app.use((req, res, next) => {
			const cdt = bauth(req)
			if (cdt && cdt.name === username && cdt.pass === password) next()
			else {
				res.set(
					'WWW-Authenticate',
					'Basic realm="httpsrv authentication"'
				)
					.status(401)
					.send('Access denied')
			}
		})
	}

	//logger & cors
	if (log || cors) {
		app.use((req, res, next) => {
			if (log)
				console.log(`${req.method} ${decodeURIComponent(req.path)}`)
			if (cors) res.set('Access-Control-Allow-Origin', cors)
			next()
		})
	}
	if (indexhtml) {
		app.get('*', async (req, res, next) => {
			//serve index.html if exists
			try {
				const file = path.join(basedir, decodeURIComponent(req.path))
				const stat = await pfs.statAsync(file)
				if (stat.isDirectory()) {
					//if current path is directory
					const file2 = path.join(
						basedir,
						decodeURIComponent(req.path),
						'index.html'
					)
					const stat2 = await pfs.statAsync(file2) //try to detect index.html under current path
					if (stat2.isFile()) {
						res.set('Content-Type', 'text/html')
						res.set('Content-Length', stat2.size)
						pfs.createReadStream(file2).pipe(res)
					} else next()
				} else next()
			} catch (err) {
				next()
			}
		})
	}
	app.get('*', showDirectory)
	if (upload) app.post('*', mu.single('file'), showDirectory)
	async function showDirectory(req, res) {
		const file = path.join(basedir, decodeURIComponent(req.path))

		try {
			const stat = await pfs.statAsync(file)
			if (!stat.isFile()) {
				//file not found
				if (fallback) pfs.createReadStream(fallbackfile).pipe(res)
				else if (stat.isDirectory()) {
					//if fallback exists, send it instead
					//if is directory, display it
					const filelist = await pfs.readdirAsync(file)
					const statlist = await Promise.all(
						filelist.map(f => pfs.statAsync(path.join(file, f)))
					)
					let list = []
					for (let i = 0; i < filelist.length; i++) {
						list.push({
							name: filelist[i],
							stat: statlist[i]
						})
					}
					if (!showdotfile) {
						list = list.filter(f => !f.name.startsWith('.'))
					}
					res.render('directory', {
						list,
						url,
						instantclick,
						upload,
						curpath: req.path
					})
				} else res.status(404).send('404 Not Found')
			} else {
				//file found
				res.set('Content-Type', mime.getType(req.path))
				if (req.headers.range) {
					const ranges = parseRange(stat.size, req.headers.range)
					if (
						typeof ranges === 'number' ||
						ranges.length > 1 ||
						ranges.type !== 'bytes'
					) {
						return res.status(416).send('416 Range Not Satisfiable')
					}
					const { start, end } = ranges[0]
					res.set('Content-Length', end - start + 1)
					res.set(
						'Content-Range',
						`bytes ${start}-${end}/${stat.size}`
					)
					res.status(206)
					pfs.createReadStream(file, { start, end }).pipe(res)
				} else {
					res.set('Content-Length', stat.size)
					res.set('Accept-Ranges', 'bytes')
					pfs.createReadStream(file).pipe(res)
				}
			}
		} catch (err) {
			if (fallback) pfs.createReadStream(fallbackfile).pipe(res)
			else if (err.code === 'ENOENT')
				//if fallback exists
				res.status(404).send('404 NOT FOUND')
			//file not found
			else res.status(500).send('500 SERVER ERROR')
		}
	}

	return app
}
