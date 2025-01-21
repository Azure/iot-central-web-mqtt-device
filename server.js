var fs = require('fs');
var http = require('http');
var mime = require('mime-types');
var path = require('path');

http.createServer(function (req, res) {
    if (req.url == '/') {
        req.url = 'device.html';
    }
    let filePath = path.join(__dirname, 'content', req.url);
    filePath = fs.realpathSync(filePath);
    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, function (err,data) {
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
console.log('Listening at http//localhost:8080');