/**
 * Module dependencies
 */

var m = require('multiline').stripIndent;
var phantom = require('x-ray-phantom');
var concat = require('concat-stream');
var read = require('fs').readFileSync;
var cheerio = require('cheerio');
var join = require('path').join;
var rm = require('rimraf').sync;
var assert = require('assert');
var isUrl = require('is-url');
var Xray = require('..');

/**
 * URL
 */

var url = 'http://lapwinglabs.github.io/static/';

/**
 * Tests
 */

describe('Xray()', function() {
  this.timeout(30000)
  it('should work with the kitchen sink', function(done) {
    var x = Xray();

    x({
      title: 'title@text',
      image: x('#gbar a@href', 'title'),
      scoped_title: x('head', 'title'),
      inner: x('title', {
        title: '@text'
      })
    })('http://google.com', function(err, obj) {
      if (err) return done(err);
      assert.equal('Google', obj.title, '{ title: title@text }');
      assert.equal('Google Images', obj.image);
      assert.equal('Google', obj.scoped_title);
      assert.equal('Google', obj.inner.title);
      done();
    })
  })

  it('should work with embedded x-ray instances', function(done) {
    var x = Xray();

    x({
      list: x('body', {
        first: x('a@href', 'title')
      })
    })(url, function(err, obj) {
      if (err) return done(err);
      assert.deepEqual(obj, {
        list: {
          first: 'Loripsum.net - The \'lorem ipsum\' generator that doesn\'t suck.'
        }
      })
      done();
    })
  })

  it('should work with an attribute-only selector', function(done) {
    var x = Xray();

    x({
      list: x('body a', {
        first: x('@href', 'title')
      })
    })(url, function(err, obj) {
      if (err) return done(err);
      assert.deepEqual(obj, {
        list: {
          first: 'Loripsum.net - The \'lorem ipsum\' generator that doesn\'t suck.'
        }
      })
      done();
    })
  })

  it('should work without passing a URL in the callback', function(done) {
    var x = Xray();
    x('http://google.com', {
      title: 'title'
    })(function(err, obj) {
      if (err) return done(err);
      assert.deepEqual(obj, {
        title: 'Google'
      })
      done();
    })
  })

  it('should work with arrays', function(done) {
    var x = Xray();

    x(url, ['a@href'])(function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://producthunt.com/', arr.pop());
      done();
    })
  })

  it.only('should work with an array without a url', function(done) {
    var x = Xray();

    x(['a@href'])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://producthunt.com/', arr.pop());
      done();
    })
  })

  it('scraping arrays should work with a scope and an attribute-only selector', function(done) {
    var x = Xray();
    x('a', ['@href'])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://loripsum.net/', arr.pop());
      assert.equal('http://producthunt.com/', arr.pop());
      done();
    })
  })

  it('scraping arrays should work with a scope and an attribute-only selector in an object', function(done) {
    var x = Xray();

    x('a', [{ link: '@href' }])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ link: 'http://loripsum.net/'    }, arr.pop());
      assert.deepEqual({ link: 'http://loripsum.net/'    }, arr.pop());
      assert.deepEqual({ link: 'http://loripsum.net/'    }, arr.pop());
      assert.deepEqual({ link: 'http://producthunt.com/' }, arr.pop());
      done();
    })
  })

  it('crawling a link with a simple function selector should work', function(done) {
    var x = Xray();
    x(x('a[href="https://google.com/"]@href', 'title'))(url, function(err, title) {
      if (err) return done(err);
      assert.equal('Google', title);
      done();
    })
  })

  // THIS IS NOT GOING TO WORK UNLESS WE PROVIDE MORE CONTEXT TO THE NESTED INSTANCE!
  it.skip('crawling link arrays with an array selector can\'t work like this without scope', function(done) {
    var x = Xray();
    x([x('a@href', 'title')])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('Google', arr[13]);
      done();
    })
  })

  // THIS COULD THOUGH
  it('crawling link arrays with an array selector should work with this syntax', function(done) {
    var x = Xray();
    x(x(['a@href'], 'title'))(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('Google', arr[13]);
      done();
    })
  })

  // SAME PROBLEM HERE...
  it.skip('crawling link arrays with an object selector can\'t work like this without scope', function(done) {
    var x = Xray();
    x([{ title: x('a@href', 'title') }])(function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  // THIS SHOULD WORK THOUGH - [@] SYNTAX
  it('crawling link arrays with an object selector should work with this syntax', function(done) {
    var x = Xray();
    x(x(['a@href'], { title: 'title' }))(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  it('crawling a link with a scope and a simple function selector should work', function(done) {
    var x = Xray();
    x('a[href="https://google.com/"]', x('@href', 'title'))(url, function(err, title) {
      if (err) return done(err);
      assert.equal('Google', title);
      done();
    })
  })

  it('crawling link arrays with a scope and an array selector should work', function(done) {
    var x = Xray();
    x('a', [x('@href', 'title')])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('Google', arr[13]);
      done();
    })
  })

  // [@] SYNTAX EQUIVALENT
  it('crawling link arrays with a scope and an array selector should work with [@] syntax', function(done) {
    var x = Xray();
    x('a', x(['@href'], 'title'))(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.equal('Google', arr[13]);
      done();
    })
  })

  it('crawling link arrays with a scope and an array-nested-object selector should work', function(done) {
    var x = Xray();
    x('a', [{ title: x('@href', 'title') }])(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  // THIS IS THE [@] EQUIVALENT FOR SCOPE (WORKS SAME AS ABOVE TEST)
  it('crawling link arrays with a scope and an array-nested-object selector should work with [scope] syntax', function(done) {
    var x = Xray();
    x(['a'], { title: x('@href', 'title') })(url, function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  it('crawling link arrays should work without a url in the callback', function(done) {
    var x = Xray();
    x(url, 'a', [{ title: x('@href', 'title') }])(function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  // THIS IS THE [@/SCOPE] EQUIVALENT (actually not quite...if there is more than one @href under a, this will only take the first one)
  it('crawling link arrays should work without a url in the callback with [scope] syntax', function(done) {
    var x = Xray();
    x(url, ['a'], { title: x('@href', 'title') })(function(err, arr) {
      if (err) return done(err);
      assert.equal(50, arr.length);
      assert.deepEqual({ title: 'Google'}, arr[13]);
      done();
    })
  })

  it('crawling one link should work with a url in the callback', function(done) {
    var x = Xray();
    x('a[href="https://google.com/"]@href', 'title')(url, function(err, title) {
      assert.equal('Google', title);
      done();
    })
  })

  // I DON'T THINK THERE IS A [SCOPE] EQUIVALENT FOR THIS RESULT
  it('should select items with a scope', function(done) {
    var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
    var $ = cheerio.load(html);
    var x = Xray();
    x('.tags', ['li'])($, function(err, arr) {
      if (err) return done(err);
      assert.equal(5, arr.length);
      assert.equal('a', arr[0]);
      assert.equal('b', arr[1]);
      assert.equal('c', arr[2]);
      assert.equal('d', arr[3]);
      assert.equal('e', arr[4]);
      done();
    })
  })

  // [SCOPE] SYNTAX. I THINK IT'S ACTUALLY EQUIVALENT TO x('.tags', 'li')
  it('should select items with a scope with [SCOPE] syntax', function(done) {
    var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
    var $ = cheerio.load(html);
    var x = Xray();
    x(['.tags'], 'li')($, function(err, arr) {
      if (err) return done(err);
      assert(1 == arr[0].length);
      assert('a' == arr[0][0]);
      assert(1 == arr[1].length);
      assert('d' == arr[1][0]);
      done();
    })
  })

  it('should select lists separately too', function(done) {
    var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
    var $ = cheerio.load(html);
    var x = Xray();

    x('.tags', [['li']])($, function(err, arr) {
      if (err) return done(err);
      assert(3 == arr[0].length);
      assert('a' == arr[0][0]);
      assert('b' == arr[0][1]);
      assert('c' == arr[0][2]);
      assert(2 == arr[1].length);
      assert('d' == arr[1][0]);
      assert('e' == arr[1][1]);
      done();
    })
  })

  it('should select lists separately too with [scope] syntax', function(done) {
    var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
    var $ = cheerio.load(html);
    var x = Xray();

    x(['.tags'], ['li'])($, function(err, arr) {
      if (err) return done(err);
      assert(3 == arr[0].length);
      assert('a' == arr[0][0]);
      assert('b' == arr[0][1]);
      assert('c' == arr[0][2]);
      assert(2 == arr[1].length);
      assert('d' == arr[1][0]);
      assert('e' == arr[1][1]);
      done();
    })
  })

  it('should select collections within collections', function(done) {
    var html = m(function() {/*
      <div class="items">
        <div class="item">
          <h2>first item</h2>
          <ul class="tags">
            <li>a</li>
            <li>b</li>
            <li>c</li>
          </ul>
        </div>
        <div class="item">
          <h2>second item</h2>
          <ul class="tags">
            <li>d</li>
            <li>e</li>
          </ul>
        </div>
      </div>
    */});

    var $ = cheerio.load(html);
    var x = Xray();

    x($, '.item', [{
      title: 'h2',
      tags: x('.tags', ['li'])
    }])(function(err, arr) {
      if (err) return done(err);
      assert.deepEqual([
        { title: 'first item', tags: [ 'a', 'b', 'c' ] },
        { title: 'second item', tags: [ 'd', 'e' ] }
      ], arr);
      done();
    })
  })

  it('should work with complex selections', function(done) {
    this.timeout(10000);

    var x = Xray();
    x('http://mat.io', {
      title: 'title',
      items: x('.item', [{
        title: '.item-content h2',
        description: '.item-content section'
      }])
    })(function(err, obj) {
      if (err) return done(err);
      assert('mat.io' == obj.title);

      assert.deepEqual({
        title: 'The 100 Best Children\'s Books of All Time',
        description: 'Relive your childhood with TIME\'s list of the best 100 children\'s books of all time http://t.co/NEvBhNM4np http://ift.tt/1sk3xdM\n\n— TIME.com (@TIME) January 11, 2015'
      }, obj.items.pop());

      assert.deepEqual({
        title: 'itteco/iframely · GitHub',
        description: 'MatthewMueller starred itteco/iframely'
      }, obj.items.pop());

      assert.deepEqual({
        title: 'Republicans Expose Obama’s College Plan as Plot to Make People Smarter - The New Yorker',
        description: 'Republicans Expose Obama’s College Plan as Plot to Make People Smarter http://t.co/OsvoOgn8Tn\n\n— Assaf (@assaf) January 11, 2015'
      }, obj.items.pop());

      done();
    });
  });

  // TODO: this could be tested better, need a static site
  // with pages
  it('should work with pagination & limits', function(done) {
    this.timeout(10000)
    var x = Xray();

    x('li.group', [{
      title: '.dribbble-img strong',
      image: '.dribbble-img [data-src]@data-src',
    }]).paginate('.next_page@href').limit(3)
    ('https://dribbble.com', function(err, arr) {
      if (err) return done(err);
      assert(arr.length, 'array should have a length');
      arr.forEach(function(item) {
        assert(item.title.length);
        assert.equal(true, isUrl(item.image));
      })
      done();
    });

  });

  it('should not call function twice when reaching the last page', function(done){
    this.timeout(10000);
    setTimeout(done, 9000);
    var timesCalled = 0;
    var x = Xray();

    x('https://github.com/lapwinglabs/x-ray/watchers', '.follow-list-item', [{
      fullName: '.vcard-username'
    }]).paginate('.next_page@href').limit(10)
    (function(err, arr) {
      timesCalled++;
      assert.equal(1, timesCalled, 'callback was called more than once');
    });
  });

  describe('.format()', function() {
    it('should support adding formatters', function() {
      // TODO
    })
  })

  describe('.write()', function() {
    it('write should work with streams', function(done) {
      var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
      var $ = cheerio.load(html);
      var x = Xray();
      x($, '.tags', [['li']]).write().pipe(concat(function(data) {
        var arr = JSON.parse(data.toString());
        assert(3 == arr[0].length);
        assert('a' == arr[0][0]);
        assert('b' == arr[0][1]);
        assert('c' == arr[0][2]);
        assert(2 == arr[1].length);
        assert('d' == arr[1][0]);
        assert('e' == arr[1][1]);
        done();
      }))
    })

    it('write should work with pagination', function(done) {
      this.timeout(10000)
      var x = Xray();

      x('https://dribbble.com', 'li.group', [{
        title: '.dribbble-img strong',
        image: '.dribbble-img [data-src]@data-src',
      }]).paginate('.next_page@href').limit(3).write().pipe(concat(function(data) {
        var arr = JSON.parse(data.toString());
        assert(arr.length, 'array should have a length');
        arr.forEach(function(item) {
          assert(item.title.length);
          assert.equal(true, isUrl(item.image));
        })
        done();
      }));
    })
  });

  describe('.write(file)', function() {
    it('should stream to a file', function(done) {
      var path = join(__dirname, 'tags.json');
      var html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>';
      var $ = cheerio.load(html);
      var x = Xray();

      x($, '.tags', [['li']]).write(path).on('finish', function() {
        var arr = JSON.parse(read(path, 'utf8'));
        assert(3 == arr[0].length);
        assert('a' == arr[0][0]);
        assert('b' == arr[0][1]);
        assert('c' == arr[0][2]);
        assert(2 == arr[1].length);
        assert('d' == arr[1][0]);
        assert('e' == arr[1][1]);
        rm(path);
        done();
      })
    })
    it('stream to a file with pagination', function(done) {
      var path = join(__dirname, 'pagination.json');
      this.timeout(10000)
      var x = Xray();

      x('https://dribbble.com', 'li.group', [{
        title: '.dribbble-img strong',
        image: '.dribbble-img [data-src]@data-src',
      }]).paginate('.next_page@href').limit(3).write(path).on('finish', function() {
        var arr = JSON.parse(read(path, 'utf8'));
        assert(arr.length, 'array should have a length');
        arr.forEach(function(item) {
          assert(item.title.length);
          assert.equal(true, isUrl(item.image));
        })
        rm(path);
        done();
      });
    });

  });

  describe('.driver(fn)', function() {
    it('should support basic phantom', function(done) {

      var x = Xray()
        .driver(phantom());

      x('http://google.com', 'title')(function(err, str) {
        if (err) return done(err);
        assert.equal('Google', str);
        done();
      })
    })
  });
})
