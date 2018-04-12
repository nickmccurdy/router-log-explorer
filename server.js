const _ = require('lodash')
const dns = require('dns')
const formidable = require('formidable')
const fs = require('fs')
const http = require('http')
const url = require('url')
const util = require('util')

const reverse = util.promisify(dns.reverse)

http
  .createServer(async (req, res) => {
    const query = url.parse(req.url, true).query

    try {
      if (req.method.toLowerCase() == 'post') {
        new formidable.IncomingForm().parse(req, (err, fields, files) => {
          res.writeHead(200, { 'content-type': 'text/plain' })
          res.write('received upload:\n\n')
          res.end(util.inspect({ fields: fields, files: files }))
        })
      } else if (query.ip) {
        const ips = _.castArray(query.ip || [])
        const hostnames = _.uniq(
          _.flatten(await Promise.all(ips.map(ip => reverse(ip))))
        )
        res.end(JSON.stringify(hostnames))
      } else {
        fs.createReadSteam('./index.html').pipe(res)
      }
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify(err))
    }
  })
  .listen(process.env.PORT)
