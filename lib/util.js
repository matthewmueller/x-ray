'use strict'

var has = Object.prototype.hasOwnProperty
var objectAssign = require('object-assign')
var isObject = require('isobject')
var isUrl = require('is-url')
var isArray = Array.isArray

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

/**
 * Check if the string is HTML
 */
function isHTML (str) {
  str = (str || '').toString().trim()
  return str[0] === '<' && str[str.length - 1] === '>'
}

module.exports = {
  root: root,
  isUrl: isUrl,
  isArray: isArray,
  isHTML: isHTML,
  compact: compact,
  isObject: isObject,
  objectAssign: objectAssign
}
