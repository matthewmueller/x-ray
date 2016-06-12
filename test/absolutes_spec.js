/* global it, describe */

/**
 * Module Dependencies
 */

var absolute = require('../lib/absolutes')
var cheerio = require('cheerio')
var assert = require('assert')

describe('absolute URLs', function () {
  var path = 'http://example.com/foo.html'

  it('should not convert URL', function () {
    var $el = cheerio.load('<a href="http://example.com/bar.html"></a>')
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html())
  })

  it('should convert absolute URL', function () {
    var $el = cheerio.load('<a href="/bar.html"></a>')
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html())
  })

  it('should convert relative URL', function () {
    var $el = cheerio.load('<a href="bar.html"></a>')
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html())
  })

  it('should not throw when encountering invalid URLs', function () {
    var $el = cheerio.load('<html><body><ul><li><a href="mailto:%CAbroken@link.com">Broken link</a></li></ul></body></html>')
    absolute(path, $el)
  })
})

describe('absolute URLs with <base> tag', function () {
  var head = '<head><base href="http://example.com/foo/"></head>'
  var path = 'http://example.com/foo.html'

  it('should convert relative URL', function () {
    var $el = cheerio.load(head + '<a href="foobar.html"></a>')
    assert.equal(head + '<a href="http://example.com/foo/foobar.html"></a>', absolute(path, $el).html())
  })

  it('should not convert relative URL starting with /', function () {
    var $el = cheerio.load(head + '<a href="/foobar.html"></a>')
    assert.equal(head + '<a href="http://example.com/foobar.html"></a>', absolute(path, $el).html())
  })
})
