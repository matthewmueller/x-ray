var path = require('path')
var read = require('fs').readFileSync
var html = read(path.resolve(__dirname, 'index.html'))
var Xray = require('../..')
var x = Xray()

x(html, '.item', [{
  title: 'h2',
  tags: x('.tags', ['li'])
}])(console.log)
