/**
 * Module Dependencies
 */

var Superagent = require('superagent');

/**
 * Export
 */

module.exports = function curl() {
  var superagent = Superagent.agent();

  return function plugin(xray) {
    xray.request = request(superagent);
    return xray;
  }
}

/**
 * Request
 *
 * @param {String} url
 * @param {Function} fn
 * @api private
 */

function request(adapter) {
  return function (url, fn) {
    adapter.get(url, function(err, res) {
      if (err) return fn(err);
      else return fn(null, res.text);
    });
  }
};
