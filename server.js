const _ = require('lodash')
const dns = require('dns')
const formidable = require('formidable')
const http = require('http')
const url = require('url')
const util = require('util')

const reverse = util.promisify(dns.reverse)

http
  .createServer(async (req, res) => {
    try {
      if (req.method.toLowerCase() == 'post') {
        new formidable.IncomingForm().parse(req, (err, fields, files) => {
          res.writeHead(200, { 'content-type': 'text/plain' })
          res.write('received upload:\n\n')
          res.end(util.inspect({ fields: fields, files: files }))
        })
      } else {
        const ips = _.castArray(url.parse(req.url, true).query.ip || [])
        const hostnames = _.uniq(
          _.flatten(await Promise.all(ips.map(ip => reverse(ip))))
        )
        res.end(JSON.stringify(hostnames))
      }
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify(err))
    }
  })
  .listen(process.env.PORT)
