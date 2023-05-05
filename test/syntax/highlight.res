@@warning("-27")
//^

%%raw(`console.log("Hello")`)
//^

@deprecated
//^
let _ = %raw(`1`)
        //^

let a = 1
//^

let _ = 1
      //^

let _ = true
        //^
let _ = false
        //^

let _ = "hello!"
          //^
let _ = `Hello World 👋 ${name}`
                  //^
let _ = 'a'
       //^

let _ = j`Today`
          //^

let _ = %re("/b/g")
       //^
let _ = true && true
           //^

let _ = true || false
           //^

let _ = !true
      //^

let _ = 2 <= 3
        //^

let _ = 2 <= 3
        //^

type t
//^

type r
   //^

type t = {
  age: int
      //^
}

type t = {
  a: promise<int>
      //^
}

let _ = list{1, 2}
        //^

let _ = {...me, age: me.age + 1}
          //^

let _ = Some("My Name")
        //^

let _ = #red
        //^

let _ = if true {
      //^
  "Good morning!"
} else {
  //^
  "Hello!"
}

for i in 1 to 10 {
//^
  Js.log(i)
 //^
}

while true {
//^
  Js.log(true)
}

exception InputClosed(string)
//^


try {
//^
  someJSFunctionThatThrows()
} catch {
  //^
| Not_found => assert false
                //^
}

open Js.Array2
//^

include Js
//^


switch [1, 2, 3] {
//^
  | [] => true
//^
  | _ => false
    //^
}

let list = 2
    //^
let array = [1]
    //^
let catch = 1
    //^
let ref = ref(false)
   //^
