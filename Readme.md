![x-ray](https://cldup.com/fMBbTcVtwB.png)

![Last version](https://img.shields.io/github/tag/matthewmueller/x-ray.svg?style=flat-square)
[![Build Status](http://img.shields.io/travis/matthewmueller/x-ray/master.svg?style=flat-square)](https://travis-ci.org/matthewmueller/x-ray)
[![Coverage Status](https://coveralls.io/repos/github/matthewmueller/x-ray/badge.svg?branch=master&style=flat-square)](https://coveralls.io/github/matthewmueller/x-ray?branch=master)
[![Dependency status](http://img.shields.io/david/matthewmueller/x-ray.svg?style=flat-square)](https://david-dm.org/matthewmueller/x-ray)
[![Dev Dependencies Status](http://img.shields.io/david/dev/matthewmueller/x-ray.svg?style=flat-square)](https://david-dm.org/matthewmueller/x-ray#info=devDependencies)
[![NPM Status](http://img.shields.io/npm/dm/x-ray.svg?style=flat-square)](https://www.npmjs.org/package/x-ray)
![Node version](https://img.shields.io/node/v/x-ray.svg?style=flat-square)
[![OpenCollective](https://opencollective.com/x-ray/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/x-ray/sponsors/badge.svg)](#sponsors)

```js
var Xray = require('x-ray')
var x = Xray()

x('https://blog.ycombinator.com/', '.post', [
  {
    title: 'h1 a',
    link: '.article-title@href'
  }
])
  .paginate('.nav-previous a@href')
  .limit(3)
  .write('results.json')
```

## Installation

```
npm install x-ray
```

## Features

- **Flexible schema:** Supports strings, arrays, arrays of objects, and nested object structures. The schema is not tied to the structure of the page you're scraping, allowing you to pull the data in the structure of your choosing.

- **Composable:** The API is entirely composable, giving you great flexibility in how you scrape each page.

- **Pagination support:** Paginate through websites, scraping each page. X-ray also supports a request `delay` and a pagination `limit`. Scraped pages can be streamed to a file, so if there's an error on one page, you won't lose what you've already scraped.

- **Crawler support:** Start on one page and move to the next easily. The flow is predictable, following
  a breadth-first crawl through each of the pages.

- **Responsible:** X-ray has support for concurrency, throttles, delays, timeouts and limits to help you scrape any page responsibly.

- **Pluggable drivers:** Swap in different scrapers depending on your needs. Currently supports HTTP and [PhantomJS driver](http://github.com/lapwinglabs/x-ray-phantom) drivers. In the future, I'd like to see a Tor driver for requesting pages through the Tor network.

## Selector API

### xray(url, selector)(fn)

Scrape the `url` for the following `selector`, returning an object in the callback `fn`.
The `selector` takes an enhanced jQuery-like string that is also able to select on attributes. The syntax for selecting on attributes is `selector@attribute`. If you do not supply an attribute, the default is selecting the `innerText`.

Here are a few examples:

- Scrape a single tag

```js
xray('http://google.com', 'title')(function(err, title) {
  console.log(title) // Google
})
```

- Scrape a single class

```js
xray('http://reddit.com', '.content')(fn)
```

- Scrape an attribute

```js
xray('http://techcrunch.com', 'img.logo@src')(fn)
```

- Scrape `innerHTML`

```js
xray('http://news.ycombinator.com', 'body@html')(fn)
```

### xray(url, scope, selector)

You can also supply a `scope` to each `selector`. In jQuery, this would look something like this: `$(scope).find(selector)`.

### xray(html, scope, selector)

Instead of a url, you can also supply raw HTML and all the same semantics apply.

```js
var html = '<body><h2>Pear</h2></body>'
x(html, 'body', 'h2')(function(err, header) {
  header // => Pear
})
```

## API

### xray.driver(driver)

Specify a `driver` to make requests through. Available drivers include:

- [request](https://github.com/Crazometer/request-x-ray) - A simple driver built around request. Use this to set headers, cookies or http methods.
- [phantom](https://github.com/lapwinglabs/x-ray-phantom) - A high-level browser automation library. Use this to render pages or when elements need to be interacted with, or when elements are created dynamically using javascript (e.g.: Ajax-calls).

### xray.stream()

Returns Readable Stream of the data. This makes it easy to build APIs around x-ray. Here's an example with Express:

```js
var app = require('express')()
var x = require('x-ray')()

app.get('/', function(req, res) {
  var stream = x('http://google.com', 'title').stream()
  stream.pipe(res)
})
```

### xray.write([path])

Stream the results to a `path`.

If no path is provided, then the behavior is the same as [.stream()](#xraystream).

### xray.then(cb)

Constructs a `Promise` object and invoke its `then` function with a callback `cb`. Be sure to invoke `then()` at the last step of xray method chaining, since the other methods are not promisified.

```js
x('https://dribbble.com', 'li.group', [
  {
    title: '.dribbble-img strong',
    image: '.dribbble-img [data-src]@data-src'
  }
])
  .paginate('.next_page@href')
  .limit(3)
  .then(function(res) {
    console.log(res[0]) // prints first result
  })
  .catch(function(err) {
    console.log(err) // handle error in promise
  })
```

### xray.paginate(selector)

Select a `url` from a `selector` and visit that page.

### xray.limit(n)

Limit the amount of pagination to `n` requests.

### xray.abort(validator)

Abort pagination if `validator` function returns `true`.
The `validator` function receives two arguments:

- `result`: The scrape result object for the current page.
- `nextUrl`: The URL of the next page to scrape.

### xray.delay(from, [to])

Delay the next request between `from` and `to` milliseconds.
If only `from` is specified, delay exactly `from` milliseconds.

### xray.concurrency(n)

Set the request concurrency to `n`. Defaults to `Infinity`.

### xray.throttle(n, ms)

Throttle the requests to `n` requests per `ms` milliseconds.

### xray.timeout (ms)

Specify a timeout of `ms` milliseconds for each request.

## Collections

X-ray also has support for selecting collections of tags. While `x('ul', 'li')` will only select the first list item in an unordered list, `x('ul', ['li'])` will select all of them.

Additionally, X-ray supports "collections of collections" allowing you to smartly select all list items in all lists with a command like this: `x(['ul'], ['li'])`.

## Composition

X-ray becomes more powerful when you start composing instances together. Here are a few possibilities:

### Crawling to another site

```js
var Xray = require('x-ray')
var x = Xray()

x('http://google.com', {
  main: 'title',
  image: x('#gbar a@href', 'title') // follow link to google images
})(function(err, obj) {
  /*
  {
    main: 'Google',
    image: 'Google Images'
  }
*/
})
```

### Scoping a selection

```js
var Xray = require('x-ray')
var x = Xray()

x('http://mat.io', {
  title: 'title',
  items: x('.item', [
    {
      title: '.item-content h2',
      description: '.item-content section'
    }
  ])
})(function(err, obj) {
  /*
  {
    title: 'mat.io',
    items: [
      {
        title: 'The 100 Best Children\'s Books of All Time',
        description: 'Relive your childhood with TIME\'s list...'
      }
    ]
  }
*/
})
```

### Filters

Filters can specified when creating a new Xray instance. To apply filters to a value, append them to the selector using `|`.

```js
var Xray = require('x-ray')
var x = Xray({
  filters: {
    trim: function(value) {
      return typeof value === 'string' ? value.trim() : value
    },
    reverse: function(value) {
      return typeof value === 'string'
        ? value
            .split('')
            .reverse()
            .join('')
        : value
    },
    slice: function(value, start, end) {
      return typeof value === 'string' ? value.slice(start, end) : value
    }
  }
})

x('http://mat.io', {
  title: 'title | trim | reverse | slice:2,3'
})(function(err, obj) {
  /*
  {
    title: 'oi'
  }
*/
})
```

## Examples

- [selector](/examples/selector/index.js): simple string selector
- [collections](/examples/collections/index.js): selects an object
- [arrays](/examples/arrays/index.js): selects an array
- [collections of collections](/examples/collection-of-collections/index.js): selects an array of objects
- [array of arrays](/examples/array-of-arrays/index.js): selects an array of arrays

## In the Wild

- [Levered Returns](http://leveredreturns.com): Uses x-ray to pull together financial data from various unstructured sources around the web.

## Resources

- Video: https://egghead.io/lessons/node-js-intro-to-web-scraping-with-node-and-x-ray

## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/x-ray#backer)]

<a href="https://opencollective.com/x-ray/backer/0/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/1/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/2/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/3/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/4/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/5/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/6/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/7/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/8/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/9/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/10/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/11/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/12/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/13/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/14/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/15/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/16/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/17/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/18/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/19/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/20/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/21/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/22/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/23/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/24/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/25/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/26/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/27/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/28/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/backer/29/website" target="_blank"><img src="https://opencollective.com/x-ray/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our website and on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/x-ray#sponsor)]

<a href="https://opencollective.com/x-ray/sponsor/0/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/1/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/2/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/3/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/4/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/5/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/6/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/7/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/8/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/9/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/10/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/11/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/12/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/13/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/14/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/15/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/16/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/17/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/18/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/19/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/20/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/21/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/22/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/23/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/24/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/25/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/26/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/27/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/28/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/x-ray/sponsor/29/website" target="_blank"><img src="https://opencollective.com/x-ray/sponsor/29/avatar.svg"></a>

## License

MIT
