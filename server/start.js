const {createServer} = require("http")
const {handleCollabRequest} = require("./server")
var nStatic = require('node-static');

const path = require("path"), fs = require("fs")

var fileServer = new nStatic.Server('./dist');

const port = 8800

createServer((req, resp) => {
  if (req.url == '/') {
    fs.readFile('dist/index.html', function(error, data) {
    resp.writeHead(200, {'Content-Type': 'text/html'});
    resp.write(data);
    return resp.end();
  })};
  handleCollabRequest(req, resp) ||
  fileServer.serve(req, resp) 
}).listen(port, "127.0.0.1")

console.log("Collab demo server listening on " + port)