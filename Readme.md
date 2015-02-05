![x-ray](https://cldup.com/r-PhcugeZ0.svg)

## Introduction [![img](https://gittask.com/lapwinglabs/x-ray.svg)](https://gittask.com/lapwinglabs/x-ray)

```js
var xray = require('x-ray');

xray('github.com/stars/matthewmueller')
  .select([{
    $root: '.repo-list-item',
    title: '.repo-list-name',
    link: '.repo-list-name a[href]',
    description: '.repo-list-description',
    meta: {
      $root: '.repo-list-meta',
      starredOn: 'time'
    }
  }])
  .paginate('.pagination a:last-child[href]')
  .limit(10)
  .write('out.json');
```

## Installation

```
npm install x-ray
```

## Features

- **Flexible schema:** Supports strings, arrays, arrays of objects, and nested object structures. The schema is not tied to the structure of the page you're scraping, allowing you to pull the data in the structure of your choosing.

- **Pagination support:** Paginate through websites, scraping each page. X-ray also supports a request `delay` and a pagination `limit`. Scraped pages can be streamed to a file, so if there's an error on one page, you won't lose what you've already scraped.

- **Complex actions:** With the PhantomJS driver, you can click on buttons, fill out forms, even login or signup before scraping the page. This allows you to scrape pages that require authentication like Facebook or Twitter.

- **Pluggable drivers:** Swap in different scrapers depending on your needs. Currently supports HTTP and [PhantomJS driver](http://github.com/lapwinglabs/x-ray-phantom) drivers. In the future, I'd like to see a Tor driver for requesting pages through the Tor network.

- **Adaptive output:** Apply custom functions to format your content. This allows you to create RSS feeds or even HTML pages from your output.

## API

#### Xray(url)

Initialize `xray` with a `url`

```js
xray('http://google.com')
```

#### Xray#select(<string|object|array> schema)

The elements you'd like to select. Uses [x-ray-select](https://github.com/lapwinglabs/x-ray-select) for matching the elements on the page.

You can specify `[attr]` to select different attributes. Here are some examples:

- `img[src]`
- `a[href]`
- `header[class]`
- `div[data-count]`

And you can use the `$root` attribute to scope the search. Here are some example selections:

##### Selecting one element:

```js
xray('http://google.com')
  .select('title')
  .run(function(err, title) {
    // title is 'Google'
  });
```

##### Selecting an array of elements:

```js
xray('http://mat.io')
  .select(['.Header-list-item a'])
  .run(function(err, array) {
    // array is [ 'Github', 'Twitter', 'Lapwing', 'Email' ]
  });
```

##### Selecting an object:

The following will select the first item:

```js
xray('http://mat.io')
  .select({
    $root: ".item",
    link: 'a[href]',
    thumb: 'img[src]',
    content: {
      $root: '.item-content',
      title: 'h2',
      body: 'section'
    },
    tags: ['.item-tags li']  
  })
  .run(function(err, object) {
    // object is the first "item":
    //
    // {
    //   link: 'http://ift.tt/1xIsboY',
    //   thumb: 'http://www.google.com/s2/favicons?domain=http://ift.tt/1xIsboY',
    //   content: {
    //      title: 'The 100 Best Children\'s Books of All Time',
    //      body: 'Relive your childhood...'
    //   },
    //   tags: [ 'twitter' ]
    // }
  });
```

It's easy to grab all the items by passing an array.

##### Selecting a collection of objects:

```js
xray('http://mat.io')
  .select([{
    $root: ".item",
    link: 'a[href]',
    thumb: 'img[src]',
    content: {
      $root: '.item-content',
      title: 'h2',
      body: 'section'
    },
    tags: ['.item-tags li']  
  }])
  .run(function(err, array) {
    // array is all the "items":
    //
    // [
    //   {
    //     link: 'http://ift.tt/1xIsboY',
    //     thumb: 'http://www.google.com/s2/favicons?domain=http://ift.tt/1xIsboY',
    //     content: {
    //        title: 'The 100 Best Children\'s Books of All Time',
    //        body: 'Relive your childhood...'
    //     },
    //     tags: [ 'twitter' ]
    //   },
    //   {
    //     ...
    //   }
    // ]
  });
```

#### Xray#use(<function> fn)

Add a plugin to augment Xray's current functionality.

Here's how to use the [PhantomJS driver](http://github.com/lapwinglabs/x-ray-phantom):

```js
var phantom = require('x-ray-phantom');

xray('http://google.com')
  .use(phantom(options))
```

#### Xray#throws(<boolean> throws)

This tells x-ray whether or not to throw if it encounters an error while parsing. Defaults to throwing (`true`).

```js
xray('https://github.com/')
  .throws(false)
```

#### Xray#paginate(<string> selector)

Crawl the website by passing a selector that contains a URL to the next or previous page:

```js
xray('https://github.com/')
  .paginate('.next[href]')
```

You can just as easily go backwards:

```js
xray('https://github.com/')
  .paginate('.prev[href]')
```

#### Xray#delay(<number> from, <number:optional> to)

When paginating, this will delay the next request randomly between `from` and `to` milliseconds.


```js
xray('http://github.com')
  .paginate('.next')
  // delays grabbing the next page for 5 to 10 seconds
  .delay(5000, 10000)
```

If you only pass `from`, it will delay exactly `from` milliseconds.

```js
xray('http://github.com')
  .paginate('.next')
  // delays grabbing the next page for 5 seconds
  .delay(5000)
```

#### Xray#format(<function> fn)

Specify a custom formatting function for each selected element.

```js
xray('https://github.com/stars/matthewmueller')
  .select([{
    $root: '.repo-list-item',
    title: '.repo-list-name',
    link: '.repo-list-name a[href]',
  }])
  .format(function(obj) {
    return mustache('<a href="{{link}}">{{title}}</a>', obj);
  })
  .run(function(err, array) {
    var html = array.join('<br/>');
  });
```

`TODO`: specify an "end", so you can do `xray.format(html)` and get back html.

#### Xray#limit(<number> limit)

When paginating, this specifies a limit to the number of pages x-ray should crawl. Defaults to no limit  (`Infinity`).

#### Xray#run(<function:optional> fn)

Start the scraper, calling `fn` when we're done scraping.

```js
xray('http://google.com')
  .select('title')
  .run(function(err, title) {
    // title is "Google"
  });
```

If no `fn` is present, we can yield on `run`.

```js
var title = yield xray('http://google.com').select('title').run();
// title is "Google"
```

#### Xray#write(<string|WritableStream> filepath) -> WritableStream

Start the scraper, streaming each page to `filepath`. Returns a [`WritableStream`](http://nodejs.org/docs/latest/api/stream.html#stream_class_stream_writable).

##### Streaming to a file

```js
xray('http://google.com')
  .select('title')
  .write('out.json')
  .on('error', error)
  .on('close', function() {
    console.log('all done');
  })
```

##### Streaming to `stdout`:

```js
xray('http://google.com')
  .select('title')
  .write(process.stdout);
```

## FAQ

- Scraping is illegal!

Actually it's not. Scraping is not illegal in the same way that BitTorrent the protocol is not illegal.
It depends on how you use it. In fact, Google is basically one big scraping company. They follow the `robots.txt` to know what they can and cannot scrape. You should make sure that you are permitted to scrape the content before scraping.

- How do you select elements?

I use the wonderful [SelectorGadget](https://chrome.google.com/webstore/detail/selectorgadget/mhjhnkcfbdhnjickkkdbjoemdmbfginb?hl=en) Chrome Extension.

## Test

To run the tests, run:

```
npm install
make test
```

## Credits

- Logo uses a modified version of [XOXO](http://thenounproject.com/xoxo/)'s [Network](http://thenounproject.com/term/network/23949/).
- Segment's [Nightmare](http://nightmarejs.org) provides the spine for the [PhantomJS driver](http://github.com/lapwinglabs/x-ray-phantom).

## License

(The MIT License)

Copyright (c) 2014 Matthew Mueller &lt;matt@lapwinglabs.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
