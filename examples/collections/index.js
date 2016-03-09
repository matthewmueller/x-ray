var read = require('fs').readFileSync
var html = read(__dirname + '/index.html')
var Xray = require('..')
var x = Xray()

x(html, {
  title: '.title',
  image: 'img@src',
  tags: ['li']
})(function (err, obj) {
  console.log(obj)
})
