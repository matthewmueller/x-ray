var read = require('fs').readFileSync
var html = read(__dirname + '/index.html')
var Xray = require('..')
var x = Xray()

x(html, ['a'])(function (err, arr) {
  console.log(arr)
})
