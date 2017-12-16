const express = require('express')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { Promise } = require('bluebird')
global.Promise=Promise
const pfs = Promise.promisifyAll(fs)

const [basedir, port = 3333] = process.argv.slice(2)
if (!basedir) console.log('fileserver <basedir> [port=3333]'), process.exit()

const app = express()
app.use((req, res, next) => {
	console.log(`${req.method} ${req.path}`)
	next()
})
app.get('*', async (req, res) => {
	const file = path.join(process.cwd(), basedir, req.path)

	try {
		let stat = await pfs.statAsync(file)
		if (!stat.isFile()) {
			if (stat.isDirectory()) res.send(renderList(await pfs.readdirAsync(file),req.path))
			else res.status(404).send('404 NOT FOUND')
		}
		else {
			res.set('Content-Type',mime.getType(req.path))
			fs.createReadStream(file).pipe(res)
		}
	}
	catch (err) {
		if (err.code === 'ENOENT') res.status(404).send('404 NOT FOUND')
		else res.status(500).send('500 SERVER ERROR')
	}
})
app.listen(port, _ => console.log(`listen on *:${port}`))

function renderList(list,curpath) {
	return '<h1>Directory</h1>'+list.map(file => `<a href="${path.join(curpath,file)}">${file}</a>`).join('<br>')
}