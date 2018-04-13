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
        new formidable.IncomingForm().parse(req, async (err, _, files) => {
          if (err) throw err
          // res.setHeader('content-type', 'application/pdf')
          // fs.createReadStream(files.upload.path).pipe(res)

          const pdfDocument = await pdfjs.getDocument(files.upload.path)
          const page = await pdfDocument.getPage(1)
          const textContent = await page.getTextContent()
          res.end(textContent.items.map(item => item.str).join(' '))
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
