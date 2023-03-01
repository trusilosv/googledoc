const {readFileSync, writeFile} = require("fs")
const {Mapping} = require("prosemirror-transform")
const {schema} = require("../schema")
const {Comments, Comment} = require("./comments")
const {Step} = require("prosemirror-transform")
const {getUser} = require("./users")

const MAX_STEP_HISTORY = 10000

// A collaborative editing document instance.
class Instance {
  constructor(id, name, steps, comments) {
    this.id = id
    this.name = name || id
    this.doc = schema.node("doc", null, [schema.node("paragraph", null, [])])
    this.comments = comments || new Comments
    this.version = (Array.isArray(steps) && steps.length > 0) ? steps.length - 1 : 0
    this.steps = steps || []
    this.lastActive = Date.now()
    this.users = Object.create(null)
    this.userCount = 0
    this.waiting = []
    this.collecting = null
  }

  loadVersionDoc(version) {
    if(this.steps.length > 0) {
      let doc = this.doc
      for (let i = 0; i < version + 1; i++) {
        let result = this.steps[i].apply(doc)
        doc = result.doc
      }
      this.doc = doc
    }
  }

  stop() {
    if (this.collecting != null) clearInterval(this.collecting)
  }

  getStepsInfo() {
    return this.steps.map((step, index) => {
        return {
          version: index,
          userName: getUser(step.clientID).name,
          createdAt: step.createdAt
        }
    })
  }

  addEvents(version, steps, comments, clientID) {
    this.checkVersion(version)
    if (this.version != version) return false
    let doc = this.doc, maps = []
    for (let i = 0; i < steps.length; i++) {
      steps[i].clientID = clientID
      steps[i].createdAt = Date.now()
      let result = steps[i].apply(doc)
      doc = result.doc
      maps.push(steps[i].getMap())
    }
    this.doc = doc
    this.version += steps.length
    this.steps = this.steps.concat(steps)
    if (this.steps.length > MAX_STEP_HISTORY)
      this.steps = this.steps.slice(this.steps.length - MAX_STEP_HISTORY)

    this.comments.mapThrough(new Mapping(maps))
    if (comments) for (let i = 0; i < comments.length; i++) {
      let event = comments[i]
      if (event.type == "delete")
        this.comments.deleted(event.id)
      else
        this.comments.created(event)
    }

    this.sendUpdates()
    scheduleSave()
    return {version: this.version, commentVersion: this.comments.version}
  }

  sendUpdates() {
    while (this.waiting.length) this.waiting.pop().finish()
  }

  // : (Number)
  // Check if a document version number relates to an existing
  // document version.
  checkVersion(version) {
    if (version < 0 || version > this.version) {
      let err = new Error("Invalid version " + version)
      err.status = 400
      throw err
    }
  }

  // : (Number, Number)
  // Get events between a given document version and
  // the current document version.
  getEvents(version, commentVersion) {
    this.checkVersion(version)
    let startIndex = this.steps.length - (this.version - version)
    if (startIndex < 0) return false
    let commentStartIndex = this.comments.events.length - (this.comments.version - commentVersion)
    if (commentStartIndex < 0) return false

    return {steps: this.steps.slice(startIndex),
            comment: this.comments.eventsAfter(commentStartIndex),
            users: this.userCount}
  }

  collectUsers() {
    const oldUserCount = this.userCount
    this.users = Object.create(null)
    this.userCount = 0
    this.collecting = null
    for (let i = 0; i < this.waiting.length; i++)
      this._registerUser(this.waiting[i].ip)
    if (this.userCount != oldUserCount) this.sendUpdates()
  }

  registerUser(ip) {
    if (!(ip in this.users)) {
      this._registerUser(ip)
      this.sendUpdates()
    }
  }

  _registerUser(ip) {
    if (!(ip in this.users)) {
      this.users[ip] = true
      this.userCount++
      if (this.collecting == null)
        this.collecting = setTimeout(() => this.collectUsers(), 5000)
    }
  }
}

const instances = Object.create(null)
let instanceCount = 0
let maxCount = 20

let saveFile = __dirname + "/../demo-instances.json", json
if (process.argv.indexOf("--fresh") == -1) {
  try {
    json = JSON.parse(readFileSync(saveFile, "utf8"))
  } catch (e) {}
}

if (json) {
  for (let prop in json){
    newInstance(prop, json[prop].name, 
      json[prop].steps.map((s, index) => {
        let step = Step.fromJSON(schema, s)
        step.clientID = json[prop].stepsInfo[index].clientID
        step.createdAt = json[prop].stepsInfo[index].createdAt
        return  step
      }), 
      new Comments(json[prop].comments.map(c => Comment.fromJSON(c))))
    }
} else {
  newInstance("2", "newDoc")
}

let saveTimeout = null, saveEvery = 1e4
function scheduleSave() {
  if (saveTimeout != null) return
  saveTimeout = setTimeout(doSave, saveEvery)
}
function doSave() {
  saveTimeout = null
  let out = {}
  for (var prop in instances) {
    out[prop] = {
      steps: instances[prop].steps,
      comments: instances[prop].comments.comments,
      stepsInfo: instances[prop].steps.map(step => ({ clientID: step.clientID, createdAt: step.createdAt })),
      name: instances[prop].name 
    }
  }
  writeFile(saveFile, JSON.stringify(out), () => null)
}

function getInstance(id, ip) {
  let inst = instances[id] || false
  if (ip) inst.registerUser(ip)
  inst.lastActive = Date.now()
  return inst
}
exports.getInstance = getInstance

function newInstance(id, name, steps, comments) {
  if (++instanceCount > maxCount) {
    let oldest = null
    for (let id in instances) {
      let inst = instances[id]
      if (!oldest || inst.lastActive < oldest.lastActive) oldest = inst
    }
    instances[oldest.id].stop()
    delete instances[oldest.id]
    --instanceCount
  }
  const inst = instances[id] = new Instance(id, name, steps, comments);
  inst.loadVersionDoc(inst.version);
  return inst
}

function instanceInfo() {
  let found = []
  for (let id in instances)
    found.push({id: id, name: instances[id].name, users: instances[id].userCount})
  return found
}
exports.instanceInfo = instanceInfo

function deleteDoc(id) {
  delete instances[id];
  doSave()
}

function createDoc(name) {
  const id = Date.now();
  newInstance(id, name)
  doSave()
}

exports.deleteDoc = deleteDoc
exports.getInstance = getInstance
exports.createDoc = createDoc