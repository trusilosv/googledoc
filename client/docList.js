import crel from "crelt";
import { GET, DELETE, POST } from "./http";


function userString(n) { return "(" + n + " user" + (n == 1 ? "" : "s") + ")" };

function showDocList(list) {
  document.querySelector(".DocList").innerHTML = "";
  const createDocButton = crel("button", { class: "DocListButton" }, "Create a new document");
  createDocButton.addEventListener("click", () => { newDocument() });
  let ul = document.querySelector(".DocList").appendChild(crel("ul", { class: "doclist" }));
  ul.appendChild(createDocButton);
  list.forEach(doc => {
    const li = crel("li");
    li.appendChild(crel("a", { "data-name": doc.id },doc.id + userString(doc.users)));
    li.appendChild(crel("button", { class: "DocListButton", "data-name": doc.id },"delete"));
    ul.appendChild(li);
  });
  
  ul.addEventListener("click", e => {
    if (e.target.nodeName == "A") { 
      location.pathname = "/docs/" + e.target.getAttribute("data-name") 
    }
    if (e.target.nodeName == "BUTTON") {
      DELETE("collab-backend/docs/" + e.target.getAttribute("data-name"))
        .then(data => showDocList(JSON.parse(data)), err => report.failure(err))
    }
  });
}

function listLoading() { 
  GET("collab-backend/docs/").then(data => showDocList(JSON.parse(data)), err => report.failure(err));
}

function newDocument() {
  let name = prompt("Name the new document", "");
  const json = JSON.stringify({ name: name });
  if (name) {
    POST("collab-backend/docs", json, "application/json")
      .then(data => showDocList(JSON.parse(data)), err => report.failure(err));
  }
}

listLoading();
