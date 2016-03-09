var read = require('fs').readFileSync
var html = read(__dirname + '/index.html')
var Xray = require('..')
var x = Xray()

x(html, '.tags', [['li']])(function (err, arr) {
  console.log(arr)
})
