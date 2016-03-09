/* global it, describe */

/**
 * Module Dependencies
 */

var params = require('../lib/params')
var cheerio = require('cheerio')
var assert = require('assert')

/**
 * Tests
 */

describe('params', function () {
  describe('1 arguments', function () {
    it("should be a selector if it's a string", function () {
      var arg = params('#hi')
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.equal('#hi', arg.selector)
    })

    it("should be a selector if it's an object", function () {
      var arg = params({ hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it("should be a selector if it's an array", function () {
      var arg = params(['hi'])
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })
  })

  describe('2 arguments', function () {
    it('should support attribute selectors', function () {
      var arg = params('@attr', { hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal('@attr', arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support selectors', function () {
      var arg = params('.hi', { hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal('.hi', arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support urls with object selectors', function () {
      var arg = params('https://google.com', { hi: 'hi' })
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support urls with string selectors', function () {
      var arg = params('https://google.com', 'hi')
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, 'hi')
    })

    it('should support urls with array selectors', function () {
      var arg = params('https://google.com', ['hi'])
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })

    it('should support HTML strings with object selectors', function () {
      var arg = params('<h2>hi</h2>', { hi: 'hi' })
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support HTML strings with string selectors', function () {
      var arg = params('<h2>hi</h2>', 'hi')
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, 'hi')
    })

    it('should support HTML strings with array selectors', function () {
      var arg = params('<h2>hi</h2>', ['hi'])
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })
  })

  describe('3 arguments', function () {
    it('should support a source, context, and selector', function () {
      var arg = params('http://google.com', '#hi', { hi: 'hi' })
      assert.equal('http://google.com', arg.source)
      assert.equal('#hi', arg.context)
      assert.deepEqual({ hi: 'hi' }, arg.selector)
    })
  })
})
