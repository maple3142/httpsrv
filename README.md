# httpsrv
A simple http file server

## Usage
```bash
npm i -g httpsrv #yarn global add httpsrv
httpsrv .
```
then open [localhost:3333](localhost:3333)

## Options
```bash
httpsrv <basedir> [port=3333]
```

## API
```javascript
const httpsrv=require('httpsrv')
const p=httpsrv({
	basedir: '.', //a relative path with process.cwd() (required)
	port: 3333, //port (required)
	log: true, //enable log (default=false)
	cors: true //enable Access-Control-Allow-Origin (default='')
}) //return a bluebird Promise, triggered when listen successful
p.then(app=>console.log('server started!')) //"app" in an express app
```