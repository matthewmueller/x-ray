/**
 * Module Dependencies
 */

var debug = require('debug')('resolve')
var isArray = require('./util').isArray
var parse = require('x-ray-parse')

/**
 * Export `resolve`
 */

module.exports = resolve

/**
 * Initialize `resolve`
 *
 * @param {$} cheerio object
 * @param {String} scope
 * @param {String|Array} selector
 * @param {Object} filters
 * @return {Array|String}
 */

function resolve ($, scope, selector, filters) {
  debug('resolve($j, %j)', scope, selector)
  var array = isArray(selector)
  var obj = parse(array ? selector[0] : selector)
  obj.attribute = obj.attribute || 'text'

  if (!obj.selector) {
    obj.selector = scope
    scope = null
  }

  var value = find($, scope, array ? [obj.selector] : obj.selector, obj.attribute)
  debug('resolved($j, %j) => %j', scope, selector, value)

  return value
}

/**
 * Find the node(s)
 *
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {String} attr
 * @return {Array|String}
 */

function find ($, scope, selector, attr) {
  if (scope && isArray(selector)) {
    var $scope = select($, scope)
    var out = []
    $scope.map(function (i) {
      var $el = $scope.eq(i)
      var $children = select($el, selector[0])
      $children.map(function (i) {
        out.push(attribute($children.eq(i), attr))
      })
    })
    return out
  } else if (scope) {
    $scope = select($, scope)
    return attribute($scope.find(selector).eq(0), attr)
  } else {
    var $selector
    if (isArray(selector)) {
      $selector = select($, selector[0])
      out = []
      $selector.map(function (i) {
        out.push(attribute($selector.eq(i), attr))
      })
      return out
    } else {
      $selector = select($, selector)
      return attribute($selector.eq(0), attr)
    }
  }
}

/**
 * Selector abstraction, deals
 * with various instances of $
 *
 * @param {Cheerio} $
 * @param {String} selector
 * @return {Cheerio}
 */

function select ($, selector) {
  if ($.is && $.is(selector)) return $
  return $.find ? $.find(selector) : $(selector)
}

/**
 * Select the attribute based on `attr`
 *
 * @param {Cheerio} $
 * @param {String} attr
 * @return {String}
 */

function attribute ($el, attr) {
  switch (attr) {
    case 'html':
      return $el.html()
    case 'text':
      return $el.text()
    default:
      return $el.attr(attr)
  }
}

// var cheerio = require('cheerio')
// var $ = cheerio.load('<ul title="some title"><li>a</li><li>b</li></ul><ul><li>c</li><li>d</li></ul>')
//
// var arr = resolve($, ['li'], 'ul')
// console.log(arr)
//
// var arr = resolve($, 'li', 'ul')
// console.log(arr)
//
// var arr = resolve($, '@title', 'ul')
// console.log(arr)
//
// var arr = resolve($, 'li')
// console.log(arr)
//
// var arr = resolve($, ['li'])
// console.log(arr)
//
// var arr = resolve($, 'ul@title')
// console.log(arr)
