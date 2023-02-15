const {createServer} = require("http")
const {handleCollabRequest} = require("./server")
const path = require("path"), fs = require("fs")


const port = 8800

createServer((req, resp) => {
  if (!handleCollabRequest(req, resp));
  if (req.url == '/') {
   fs.readFile('./index.html', function(error, data) {
    resp.writeHead(200, {'Content-Type': 'text/html'});
    resp.write(data);
    return resp.end();
  })};
}).listen(port, "127.0.0.1")

console.log("Collab demo server listening on " + port)



