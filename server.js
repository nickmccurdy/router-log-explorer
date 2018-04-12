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
        new formidable.IncomingForm().parse(req, (err, _, files) => {
          if (err) throw err
          // res.setHeader('content-type', 'application/pdf')
          // fs.createReadStream(files.upload.path).pipe(res)
          
          const pdfDocument = await pdfjsLib.getDocument(files.upload.path);
          const page = await pdfDocument.getPage(1);
          const textContent = await page.getTextContent();
          console.log(textContent.items.map(item => item.str).join(' '));
          res.end();
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
  .listen(process.env.PORT)