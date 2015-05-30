var Xray = require('./');
var x = Xray();

x('http://google.com', {
  main: 'title',
  image: x('https://images.google.com', 'title')
})(function(err, obj) {
  console.log(obj); // => { main: 'Google', image: 'Google Images' }
})
