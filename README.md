# httpsrv
A simple http file server

## Usage
```bash
npm i -g httpsrv #yarn global add httpsrv
httpsrv .
```
then open [localhost:3333](localhost:3333)

## Options
```
Usage: httpsrv <basedir>

Options:
  --help           Show help                                           [boolean]
  --version        Show version number                                 [boolean]
  --port, -p       Port to listen                       [number] [default: 3333]
  --log, -l        Enable logger                                       [boolean]
  --cors, -c       Access-Control-Allow-Origin header                   [string]
  --fallback, -f   A file will be send when 404, useful in SPA          [string]
  --indexhtml, -i  Try to show index.html if exists                    [boolean]

Examples:
  httpsrv . -p 8888  Start server on port 8888
```

## API (cli.js)
```javascript
#!/usr/bin/env node
const createServer = require('./index') //require('httpsrv')
const { _: [basedir], port, log, cors, fallback, indexhtml } = require('yargs')
  .usage('Usage: $0 <basedir>') //many things....

//options same as cli options, return an express app
const app=createServer({ basedir, log, cors, fallback, indexhtml })
app.listen(port, _ => console.log(`listen on *:${port}`))
```