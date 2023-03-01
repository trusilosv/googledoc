import { GET, POST } from "./http";

const select = document.querySelector("#select_users");

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
  const currentUser =  JSON.parse(sessionStorage.getItem("userId"));
  if (currentUser) {
    select.value = JSON.parse(sessionStorage.getItem("userId"))
  } else {
    select.value = 1
  }
}

function createUser() {
  let name = prompt("Name the new User", "");
  const json = JSON.stringify({ name: name });
  if (name) {
    POST("/collab-backend/users", json, "application/json")
      .then(data => {
        sessionStorage.setItem("userId", JSON.parse(data).id)
      }, err => report.failure(err));
  }
}

function setCurrentUser() {
    if (select.value == "new") { createUser() }
    sessionStorage.setItem("userId" , select.value)
    usersLoading()
}


function usersLoading() {
    GET("/collab-backend/users/").then(data => addUsers(JSON.parse(data)), err => report.failure(err));
}

select.addEventListener("change", setCurrentUser);
usersLoading();