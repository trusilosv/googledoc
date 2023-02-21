const {createServer} = require("http")
const {handleCollabRequest} = require("./server")
var nStatic = require('node-static');
const { getInstance }  = require("./instance");
const path = require("path"), fs = require("fs");

var fileServer = new nStatic.Server('./public');

function maybeCollab(req, resp) {
  let url = req.url, backend = url.replace(/\/collab-backend\b/, "")
  if (backend != url) {
    req.url = backend
    if (handleCollabRequest(req, resp)) return true
    req.url = url
  }
  return false
}

function getDocPage(req, resp) {
  const  parts = req.url.split("/")
  if (parts[1] == "docs" && !!getInstance(parts[2])){
  fs.readFile('pages/doc.html', function(error, data) {
    resp.writeHead(200, {'Content-Type': 'text/html'});
    resp.end(data)
    return true
  })
    return false
  }
}


const port = 8800

createServer((req, resp) => {
  switch(req.url.split("/")[1]){
    case '': 
      fs.readFile('pages/home.html', function(error, data) {
        resp.writeHead(200, {'Content-Type': 'text/html'});
        return resp.end(data);
      })
    break;
    case "docs" : getDocPage(req, resp)
    break;
    default: maybeCollab(req, resp) || fileServer.serve(req, resp) 
  }
}).listen(port, "127.0.0.1")

console.log("Collab demo server listening on " + port)