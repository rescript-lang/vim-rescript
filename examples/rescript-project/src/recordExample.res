module User = {
  type t = {name: string}
}

module Role = {
  type t = {roleName: string}
}

let logUser = (u: User.t) => {
  Js.log(u.name)
}

let logRole = (r: Role.t) => {
  Js.log(r.roleName)
}

