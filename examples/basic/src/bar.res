/* * this is a test */
type t

@bs.val external test: t => unit = "test"

/* * Decodes a JSON value into a [bool]
    
{b Returns} a [bool] if the JSON value is a [true] or [false].
@raise [DecodeError] if unsuccessful 
@example {[
  open Json
  (* returns true *)
  let _ = Json.parseOrRaise "true" |> Decode.bool
  (* returns false *)
  let _ = Json.parseOrRaise "false" |> Decode.bool
  (* raises DecodeError *)
  let _ = Json.parseOrRaise "123" |> Decode.bool
  (* raises DecodeError *)
  let _ = Json.parseOrRaise "null" |> Decode.bool
]}
*/
let hello_world = "whatever"

let whatever = test

let a = (a, b) => a + b

let hooloo = hello_world

let abc = <div id="test" />

@react.component
let make = () => {
  <div> {React.string("test")} </div>
}

type user = {name: string}

type what = A(string) | B(int)

let u = {name: "test"}

let labelTest = (~test: string) => {
  "Hello " ++ test
}

module Test = {
  @react.component
  let make = (~name) => {
    let inputRef = React.useRef(Js.Nullable.null)

    <div>
      <input ref={ReactDOM.Ref.domRef(inputRef)} /> <button> {React.string("Click me " ++ name)} </button>
    </div>
  }
}

let poly1 = #test
let poly2 = #\"foobar"
let poly3 = #"foobar"

let callbackU = (. a) => Js.log(a)
