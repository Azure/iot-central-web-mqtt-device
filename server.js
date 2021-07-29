var fs = require('fs'),
http = require('http');
var mime = require('mime-types')

http.createServer(function (req, res) {
    if (req.url == '/') {
        req.url = 'device.html';
    }
    if (fs.existsSync(__dirname + '/content/' +  req.url)) {
        fs.readFile(__dirname + '/content/' +  req.url, function (err,data) {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            var contentType = mime.lookup(req.url);
            var headers = {};
            res.setHeader('content-type', contentType);
            res.writeHead(200);
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(8080);
console.log('Listening at http://localhost:8080');