@@warning("-27")

%%raw(`console.log("Hello")`)

let a = %re("/b/g")

@deprecated
let a = %raw(`1`)

type t = {a: list, b: promise<string>}

let a = list{1, 2, 3}

let arr = [1, 2, 3]

open Js

if true {
  "Good morning!"
} else {
  "Hello!"
}

for i in 1 to 10 {
  Js.log(i)
}

for x in 3 downto 1 {
  Js.log(x)
}

while true {
  Js.log(true)
}

exception InputClosed(string)

try {
  someJSFunctionThatThrows()
} catch {
| Not_found => assert false
}
