var read = require('fs').readFileSync;
var html = read(__dirname + '/arrays.html');
var Xray = require('..');
var x = Xray()

x(html, ['a'])(function(err, arr) {
  console.log(arr);
})
