'use strict';

var React = require("react");
var Awesome$Awesomeness = require("awewsomeness/src/Awesome.bs.js");

function MyComponent(Props) {
  return React.createElement("div", undefined, "My Rescript Component", React.createElement(Awesome$Awesomeness.make, {}));
}

var make = MyComponent;

exports.make = make;
/* react Not a pure module */
