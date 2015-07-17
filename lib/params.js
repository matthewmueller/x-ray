/**
 * Module Dependencies
 */

var isHTML = require('./is-html');
var isUrl = require('is-url');
var isArray = Array.isArray;

/**
 * Export `params`
 */

module.exports = params;

/**
 * Sort out the parameters
 *
 * @param {String|Array|Object} source
 * @param {String|Array|Object} scope
 * @param {String|Array|Object} selector
 * @return {Object}
 */

function params(source, scope, selector) {
  var args = {};
  if (undefined === scope) { // only 1 arg provided
    args.source = null;
    args.scope = null;
    args.selector = source;
  } else if (undefined === selector) { // 2 args provided
    args.source = source;
    args.scope = null;
    args.selector = scope;
  } else {
    args.source = source;
    args.scope = scope;
    args.selector = selector;
  }
  return args;
}
