const _ = require('lodash')
const dns = require('dns')
const formidable = require('formidable')
const fs = require('fs')
const http = require('http')
const pdfjs = require('pdfjs-dist')
const url = require('url')
const util = require('util')

const reverse = util.promisify(dns.reverse)

http
  .createServer(async (req, res) => {
    try {
      const query = url.parse(req.url, true).query

      if (req.method.toLowerCase() == 'post') {
        new formidable.IncomingForm().parse(req, async (err, fields, files) => {
          if (err) throw err

          const pdfDocument = await pdfjs.getDocument(files.upload.path)
          const contents = await Promise.all(
            _.range(1, pdfDocument.numPages + 1).map(async n => {
              const page = await pdfDocument.getPage(n)
              return page.getTextContent()
            })
          )
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify(
              _.flatMap(contents, content => _.map(content.items, 'str'))
            )
          )
        })
      } else if (query.ip) {
        const ips = _.castArray(query.ip)
        const hostnames = _.uniq(
          _.flatten(await Promise.all(ips.map(ip => reverse(ip))))
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
