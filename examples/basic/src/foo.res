let a = 1

let b = "test"

let c = Bar.hello_world

let d = Bar.whatever

let f = "test"

let asdf = <Bar />

let foo = Bar.Test.make

let fdsa = <Bar.Test name="test" />

let plus1 = a => {
  Js.log("called plus 1")
  a + 1
}

let plus2 = a => {
  Js.log("called plus 2")
  a + 2
}

let compose = (f, g, x) => f(g(x))

let plus4 = plus1->compose(plus2)->compose(plus1)

Js.log(plus4)

