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
  if ('string' != typeof str && !isArray(str)) return false;
  if (isHTML(str)) return false;
  return (str && ~str.indexOf('@')) || (isArray(str) && ~str[0].indexOf('@'));
}
