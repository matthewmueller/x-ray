![x-ray](https://cldup.com/fMBbTcVtwB.png)

```js
var Xray = require('x-ray');
var x = Xray();

x('https://dribbble.com', 'li.group', [{
  title: '.dribbble-img strong',
  image: '.dribbble-img [data-src]@data-src',
}])
  .paginate('.next_page@href')
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
var html = "<body><h2>Pear</h2></body>";
x(html, 'body', 'h2', function(err, header) {
  header // => Pear
})
```

## API

### xray.driver(driver)

Specify a `driver` to make requests through.

### xray.write([path])

Stream the results to a `path`. If no path is provided, a readable stream is returned.
This makes it easy to build APIs around x-ray. Here's an example with Express:

```js
var app = require('express')();
var x = require('x-ray')();

app.get('/', function(req, res) {
  res.send(x('http://google.com', 'title').write());
})
```

### xray.paginate(selector)

Select a `url` from a `selector` and visit that page. Available drivers include:

- [phantom driver](https://github.com/lapwinglabs/x-ray-phantom)

### xray.limit(n)

Limit the amount of pagination to `n` requests.

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

X-ray also has support for selecting collections of tags. While `x(ul', 'li')` will only select the first list item in an unordered list, `x(ul, ['li'])` will select all of them.

Additionally, X-ray supports "collections of collections" allowing you to smartly select all list items in all lists with a command like this: `x(['ul'], ['li'])`.

## Composition

X-ray becomes more powerful when you start composing instances together. Here are a few possibilities:

### Paginating to another site

```js
var Xray = require('x-ray');
var x = Xray();

x('http://google.com', {
  main: 'title',
  image: x('#gbar a@href', 'title'), // follow link to google images
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
var Xray = require('x-ray');
var x = Xray();

x('http://mat.io', {
  title: 'title',
  items: x('.item', [{
    title: '.item-content h2',
    description: '.item-content section'
  }])
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

## Examples

- [selector](/examples/selector.js): simple string selector
- [collections](/examples/collections.js): selects an object
- [array](/examples/arrays.js): selects an array
- [collections of collections](/examples/collection-of-collections.js): selects an array of objects
- [array of arrays](/examples/array-of-arrays.js): selects an array of arrays

## In the Wild

- [Levered Returns](http://leveredreturns.com): Uses x-ray to pull together financial data from various unstructured sources around the web.

## Test

To run the tests, run:

```
npm install phantomjs -g
npm install
make test
```

> You'll need to be running node >= 0.11.0 to run the tests, since they rely on generators.

## License

MIT
