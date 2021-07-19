module User: {
  type t = {name: string}
}

module Role: {
  type t = {roleName: string}
}

let logUser: User.t => unit

let logRole: Role.t => unit
