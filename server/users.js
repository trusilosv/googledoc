const {readFileSync, writeFile} = require("fs")
class User {
  constructor(name, id) {
    this.name = name
    this.id = id || new Date().getTime().toString()
  }
}

let users = Object.create(null);
let saveFile = __dirname + "/../users.json", json;
let currentUser = null

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

function getUser(id) {
  return users[id]
}

function newUser(name, id) {
   let user = null;
    if(id) { users[id] = new User(name, id) }
    else { 
      user  =  new User(name);
      users[user.id] = user;
    } 
    doSave()
  return users[id] || users[user.id] 
}

function deleteUser(id) {
  delete users[id];
  doSave()
}

function  setCurrentUser(id) {
  currentUser = getUser(id);
  console.log("setCur", currentUser )
}

function getCurentUser(){
  console.log(currentUser)
    return currentUser
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
exports.setCurrentUser = setCurrentUser
exports.getCurentUser = getCurentUser
