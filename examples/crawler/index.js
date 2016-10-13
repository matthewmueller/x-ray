var Xray = require('..')
var x = Xray()

x('http://www.imdb.com/', {
  title: ['title'],
  links: x('.rhs-body .rhs-row', [{
    text: 'a',
    href: 'a@href',
    next_page: x('a@href', {
      title: 'title',
      heading: 'h1'
    })
  }])
})(function (err, obj) {
  console.log(err, obj)
})
