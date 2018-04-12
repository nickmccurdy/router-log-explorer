const _ = require('lodash')
const dns = require('dns')
const http = require('http')
const url = require('url')
const util = require('util')

const reverse = util.promisify(dns.reverse)

http
  .createServer(async (req, res) => {
    try {
        if (req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });

    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  )
    } else {
      
      const ips = _.castArray(url.parse(req.url, true).query.ip || [])
      const hostnames = _.uniq(_.flatten(await Promise.all(ips.map(ip => reverse(ip)))))
      res.end(JSON.stringify(hostnames))}
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify(err))
    }
  })
  .listen(process.env.PORT)
