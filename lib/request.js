/**
 * Module Dependencies
 */

var Superagent = require('superagent');

/**
 * Export the default `driver`
 */

module.exports = driver;

/**
 * Initialize the default
 * `driver` makes an GET
 * request using superagent
 *
 * @param {Object} opts
 * @return {Function} plugin
 */

function driver(opts) {
  var superagent = Superagent.agent(opts);

  return function plugin(xray) {

    xray.request = function request(url, fn) {
      superagent.get(url, function(err, res) {
        if (err) return fn(err);
        else return fn(null, res.text);
      });
    };

    return xray;
  }
}
