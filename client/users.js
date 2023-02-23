import { GET, POST } from "./http";

const select = document.querySelector("#users");

function addUsers(users) {
  select.innerHTML = "";
  users.forEach(element => {
    let option = document.createElement("option");
    option.text = element.name;
    option.value = element.id;
    select.add(option);
  });
  let newUserOption = document.createElement("option");
  newUserOption.text = "create user";
  newUserOption.value = "new";
  select.add(newUserOption);
  const currentUser =  JSON.parse(sessionStorage.getItem("user"));
  if (currentUser) select.value = JSON.parse(sessionStorage.getItem("user")).id;
}

function createUser() {
  let name = prompt("Name the new User", "");
  const json = JSON.stringify({ name: name });
  if (name) {
    POST("/collab-backend/users", json, "application/json")
      .then(data => {
        sessionStorage.setItem("user", data)
      }, err => report.failure(err));
  }
}

function setCurrentUser() {
    if (select.value == "new") { createUser() }
    else {
      const json = JSON.stringify({ id: select.value });
      POST("/collab-backend/current-user", json, "application/json")
        .then(data => {
          sessionStorage.setItem("user", data)
        }, err => report.failure(err));
    }
    usersLoading()
}


function usersLoading() {
    GET("/collab-backend/users/").then(data => addUsers(JSON.parse(data)), err => report.failure(err));
}

select.addEventListener("change", setCurrentUser);
usersLoading();