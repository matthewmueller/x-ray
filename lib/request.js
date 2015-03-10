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
      var req = superagent.get(url);
      var ua = xray.ua();
      if (ua) req.set('User-Agent', ua);
      req.end(function(err, res) {
        if (err) return fn(err);
        else return fn(null, res.text);
      });
    };

    return xray;
  }
}
