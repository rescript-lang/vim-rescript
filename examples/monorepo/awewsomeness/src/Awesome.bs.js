'use strict';

var React = require("react");

function Awesome(Props) {
  return React.createElement("div", undefined, "This is an awersome component");
}

var make = Awesome;

exports.make = make;
/* react Not a pure module */
