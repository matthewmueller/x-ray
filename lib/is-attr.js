var isArray = Array.isArray;
var isHTML = require('./is-html.js');

/**
 * Export `isAttr`
 */

module.exports = isAttr;

/**
 * Check if the string is an attribute selector
 */

function isAttr(str) {
  return !isHTML(str) && ((str && ~str.indexOf('@')) || (isArray(str) && ~str[0].indexOf('@')));
}
