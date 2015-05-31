/**
 * Module Dependencies
 */

var absolute = require('../lib/absolutes');
var cheerio = require('cheerio');
var assert = require('assert');

describe('absolute URLs', function(){
  var path = 'http://example.com/foo.html';

  it('should not convert URL', function(){
    var $el = cheerio.load('<a href="http://example.com/bar.html"></a>');
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html());
  });

  it('should convert absolute URL', function(){
    var $el = cheerio.load('<a href="/bar.html"></a>');
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html());
  });

  it('should convert relative URL', function(){
    var $el = cheerio.load('<a href="bar.html"></a>');
    assert.equal('<a href="http://example.com/bar.html"></a>', absolute(path, $el).html());
  });
});
