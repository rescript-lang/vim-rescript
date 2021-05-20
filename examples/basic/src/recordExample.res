module User = {
  type t = {name: string}
}

module Role = {
  type t = {roleName: string}
}

let doSomething = (u: User.t) => {
  Js.log(u.name)
}

let other = (r: Role.t) => {
  Js.log(r.roleName)
}
