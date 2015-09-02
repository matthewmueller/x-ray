/**
 * Module dependencies
 */

var assign = require('object-assign')
var Crawler = require('./lib/crawler')

/**
 * Export `Xray`
 */

module.exports = Xray

/**
 * Defaults
 */

var defaults = {
  headers: {}
}

/**
 * Initialize `Xray`
 *
 * @param {Object} options
 * @return {Crawler}
 */

function Xray(options) {
  if (!(this instanceof Xray)) return new Xray(options)
  this.state = assign({}, defaults, options)
}

/**
 * Get
 */

Xray.prototype.get = function(url, headers) {
  return new Crawler(assign({}, this.state, {
    headers: headers || {}
    method: 'get',
    url: url
  }))
};

/**
 * header
 */

Xray.prototype.header = function(k, v) {

};
