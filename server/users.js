const {readFileSync, writeFile} = require("fs")
class User {
  constructor(name, id) {
    this.name = name
    this.id = id || Date.now()
  }
}

let users = Object.create(null);
let saveFile = __dirname + "/../users.json", json;

if (process.argv.indexOf("--fresh") == -1) {
  try {
    json = JSON.parse(readFileSync(saveFile, "utf8"))
  } catch (e) {}
}

if (json) {
    for (let prop in json) newUser(json[prop].name, prop)
  }

function doSave() {
  let out = {}
  for (var prop in users) out[prop] = { name: users[prop].name }
  writeFile(saveFile, JSON.stringify(out), () => null)
}


function newUser(name, id) {
   let user = null;
    if(id) { users[id] = new User(name, id) }
    else { 
      user = new User(name);
      users[user.id] = user;
    }
  return id || user.id
}

function getUser(id) {

  return users[id]
}

function deleteUser(id) {
  delete users[id];
  doSave()
}

function usersInfo() {
  let found = []
  for (let id in users)
    found.push({id: id, name: users[id].name })
  return found
}

exports.usersInfo = usersInfo
exports.getUser = getUser
exports.createUser = newUser
exports.deleteUser = deleteUser
exports.doSave = doSave
