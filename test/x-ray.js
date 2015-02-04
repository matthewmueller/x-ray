/**
 * Module Dependencies
 */

var rm = require('fs').unlinkSync;
var join = require('path').join;
var assert = require('assert');
var xray = require('..');
var fs = require('fs');

/**
 * Tests
 */

describe('x-ray', function() {

  describe('http', function() {

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
  });

})

/**
 * Read
 */

function get(path) {
  return require(join(__dirname, 'fixtures', path));
}
