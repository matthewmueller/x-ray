/**
 * Module Dependencies
 */

var isHTML = require('./util').isHTML
var isUrl = require('./util').isUrl

/**
 * Export `params`
 */

module.exports = params

/**
 * Sort out the parameters
 *
 * @param {String|Array|Object} source
 * @param {String|Array|Object} context
 * @param {String|Array|Object} selector
 * @return {Object}
 */

function params (source, context, selector) {
  var args = {}
  if (undefined === context) {
    args.source = null
    args.context = null
    args.selector = source
  } else if (undefined === selector) {
    if (isUrl(source) || source.html || isHTML(source)) {
      args.source = source
      args.context = null
    } else {
      args.source = null
      args.context = source
    }
    args.selector = context
  } else {
    args.source = source
    args.context = context
    args.selector = selector
  }

  return args
}
