'use strict'

var isUrl = require('is-url')
var isArray = Array.isArray
var has = Object.prototype.hasOwnProperty

/**
 * Get the root, if there is one.
 *
 * @param {Mixed}
 * @return {Boolean|String}
 */
function root (selector) {
  return (typeof selector === 'string' || isArray(selector)) &&
  !~selector.indexOf('@') &&
  !isUrl(selector) &&
  selector
}

/**
 * Compact an array,
 * removing empty objects
 *
 * @param {Array} arr
 * @return {Array}
 */
function compact (arr) {
  return arr.filter(function (val) {
    if (!val) return false
    if (val.length !== undefined) return val.length !== 0
    for (var key in val) if (has.call(val, key)) return true
    return false
  })
}

module.exports = {
  root: root,
  isUrl: isUrl,
  isArray: isArray,
  compact: compact
}
