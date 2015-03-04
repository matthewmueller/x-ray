/**
 * Module Dependencies
 */

var stdout = require('catch-stdout');
var rm = require('fs').unlinkSync;
var join = require('path').join;
var assert = require('assert');
var isArray = Array.isArray;
var subs = require('subs');
var xray = require('..');
var fs = require('fs');

/**
 * Tests
 */

describe('x-ray', function() {

  it('should support strings', function(done) {
    xray('http://mat.io')
      .select('title')
      .run(function(err, str) {
        if (err) return done(err);
        assert.equal('mat.io', str)
        done();
      });
  })

  describe('prepares', function() {
    it('should support prepares', function(done) {
      function uppercase(str) {
        return str.toUpperCase();
      }

      xray('http://mat.io')
        .select('title | uppercase')
        .prepare({ uppercase: uppercase })
        .run(function(err, str) {
          if (err) return done(err);
          assert.equal('MAT.IO', str)
          done();
        });
    })
  });

  it('should support arrays', function(done) {
    xray('http://mat.io')
      .select(['.Header-list-item a'])
      .run(function(err, arr) {
        if (err) return done(err);
        assert.deepEqual(arr, [
          'Github',
          'Twitter',
          'Lapwing',
          'Email'
        ]);
        done();
      });
  })

  it('should select an object', function(done) {
    var fixture = get('select-keys');
    xray('http://mat.io')
      .select(fixture.input[0])
      .run(function(err, obj) {
        if (err) return done(err);
        assert('http' == obj.link.slice(0, 4));
        assert('http' == obj.thumb.slice(0, 4));
        assert(obj.content.title.length);
        assert(obj.content.body.length);
        assert(isArray(obj.tags));
        done();
      })
  })

  it('should select keys', function(done) {
    var fixture = get('select-keys');
    xray('http://mat.io')
      .select(fixture.input)
      .run(function(err, arr) {
        if (err) return done(err);
        assert.deepEqual(arr.pop(), fixture.expected);
        done();
      });
  });

  it('should be yieldable', function *() {
    var fixture = get('select-keys');
    var title = yield xray('http://google.com').select('title').run();
    assert('Google' == title);
  });

  it('should stream to a file', function(done) {
    var fixture = get('select-keys');
    var path = join(__dirname, 'out.json');

    xray('http://mat.io')
      .select(fixture.input)
      .write(path)
      .on('error', done)
      .on('close', function() {
        var str = fs.readFileSync(path, 'utf8');
        var arr = JSON.parse(str);
        assert.deepEqual(arr.pop(), fixture.expected);
        rm(path);
        done();
      });
  })

  it('should stream strings to stdout', function(done) {
    var restore = stdout();
    xray('http://google.com')
      .select('title')
      .write(process.stdout)
      .once('error', done)
      .once('close', function() {
        assert('Google' == restore());
        done();
      })
  });

  it('should stream objects to stdout', function(done) {
    var restore = stdout();
    xray('http://google.com')
      .select({
        title: 'title'
      })
      .write(process.stdout)
      .once('error', done)
      .once('close', function() {
        assert.deepEqual({ title: 'Google' }, JSON.parse(restore()));
        done();
      })
  });

  it('should be an array when streaming an object and paginating', function(done) {
    var restore = stdout();
    xray('https://github.com/stars/matthewmueller')
      .select({
        $root: '.repo-list-item',
        title: '.repo-list-name'
      })
      .paginate('.pagination a:last-child[href]')
      .limit(2)
      .write(process.stdout)
      .once('error', done)
      .once('close', function() {
        var arr = JSON.parse(restore());
        arr.forEach(function(item) {
          assert(item.title.length);
        });
        done();
      })
  });

  it('should paginate', function(done) {
    var fixture = get('paginate');
    xray('https://github.com/stars/matthewmueller')
      .select(fixture.input)
      .paginate('.pagination a:last-child[href]')
      .limit(2)
      .run(function(err, arr) {
        if (err) return done(err);
        fixture.expected(arr);
        done();
      });
  });

  it('should add delay to pagination', function(done) {
    var fixture = get('paginate');
    xray('https://github.com/stars/matthewmueller')
      .select(fixture.input)
      .paginate('.pagination a:last-child[href]')
      .limit(2)
      .delay(2000)
      .run(function(err, arr) {
        if (err) return done(err);
        fixture.expected(arr);
        done();
      });
  })

  it('should stream to a file and paginate', function(done) {
    var fixture = get('paginate');
    var path = join(__dirname, 'out.json');

    xray('https://github.com/stars/matthewmueller')
      .select(fixture.input)
      .paginate('.pagination a:last-child[href]')
      .limit(2)
      .write(path)
      .on('error', done)
      .on('close', function() {
        var str = fs.readFileSync(path, 'utf8');
        var arr = JSON.parse(str);
        fixture.expected(arr);
        rm(path);
        done();
      });
  });

  it('should yield an empty array on unmatched collections', function(done) {
    xray('http://mat.io')
      .select([{
        title: '.titlez'
      }])
      .run(function(err, arr) {
        if (err) return done(err);
        assert.deepEqual([], arr);
        done();
      })
  })

  it('should support formatting', function(done) {
    var fixture = get('select-keys');
    xray('http://mat.io')
      .select(fixture.input)
      .format(format)
      .run(function(err, arr) {
        if (err) return done(err);
        arr.forEach(function(item) {
          assert(~item.indexOf('<a href="http'));
        })
        done();
      })

    function format(obj) {
      return subs('<a href="{link}">{thumb}</a>', obj);
    }
  })

  it('should support url without schemes', function(done) {
    xray('http://mat.io')
      .select(['link[href]'])
      .run(function(err, arr) {
        if (err) return done(err);
        assert.equal('http://mat.io/favicon.ico', arr[0])
        done();
      })
  })
})

/**
 * Read
 */

function get(path) {
  return require(join(__dirname, 'fixtures', path));
}
