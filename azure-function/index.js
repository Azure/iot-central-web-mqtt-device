var fs = require("fs")
var mime = require('mime-types')

module.exports = function (context, req) {

    var file="index.html"

    if (req.query.file) {
            file=req.query.file
    }

    file = file.replace(/\//g, "\\");

    fs.readFile(__dirname + "\\content\\" +  file, function(err, data) {

        context.log('GET ' + __dirname + "\\content\\" +  file);

        if (!err){

            var contentType = mime.lookup(file) 

            context.res = {
                status: 200, 
                body: data,
                isRaw: true,
                headers: {
                    'Content-Type': contentType
                }
            };
        } else {

            context.log("Error: " + err)

            context.res = {
                status: 404, 
                body: "Not Found.",
                headers: {
                }
            };          
        }
        context.done()
    });
};