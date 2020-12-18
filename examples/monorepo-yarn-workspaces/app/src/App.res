@react.component
let make = () => {
  Common.Header.make(Js.Obj.empty())->Js.log
  Common.Footer.make(Js.Obj.empty())->Js.log

  <> <Common.Header /> <div> {React.string("Main content")} <Common.Footer /> </div> </>
}

make(Js.Obj.empty())->Js.log
