var read = require('fs').readFileSync;
var html = read(__dirname + '/array-of-arrays.html');
var Xray = require('..');
var x = Xray()

x(html, '.tags', [['li']])(function(err, arr) {
  console.log(arr);
});
