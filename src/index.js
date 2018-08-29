import Transaction from "./transaction";

String.prototype.format = function() {
  var a = this;
  for (var k in arguments) {
    a = a.replace(new RegExp("\\{" + k + "\\}", "g"), arguments[k]);
  }
  return a;
};

export default Transaction;
