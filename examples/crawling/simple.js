var Xray = require('../..')

var url = 'http://totalwind.net/foro/viewforum.php?f=48&sid=e2da51bf6c0efcf8cacf87a4c2071731'

Xray('http://google.com', {
  main: 'title',
  image: Xray('https://images.google.com', 'title')
})(console.log)
