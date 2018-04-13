const _ = require('lodash')
const { JSDOM } = require('jsdom')
const dns = require('dns')
const formidable = require('formidable')
const fs = require('fs')
const http = require('http')
const url = require('url')
const util = require('util')

http
  .createServer(async (req, res) => {
    try {
      const query = url.parse(req.url, true).query

      if (req.method.toLowerCase() == 'post') {
        new formidable.IncomingForm().parse(req, async (err, fields, files) => {
          if (err) throw err

          const dom = await JSDOM.fromFile(files.upload.path)
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify(
              _.chunk(
                _.compact(
                  _.map(
                    _.map(
                      dom.window.document.querySelectorAll('td'),
                      'textContent'
                    ),
                    _.trim
                  )
                ),
                3
              )
            )
          )
        })
      } else if (query.ip) {
        const ips = _.castArray(query.ip)
        const hostnames = _.uniq(
          _.flatten(
            await Promise.all(ips.map(ip => util.promisify(dns.reverse)(ip)))
          )
        )
        res.end(JSON.stringify(hostnames))
      } else {
        res.setHeader('content-type', 'text/html')
        fs.createReadStream('./index.html').pipe(res)
      }
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify(err))
    }
  })
  .listen(process.env.PORT || 3000)
