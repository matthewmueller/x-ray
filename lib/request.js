/**
 * Module Dependencies
 */

var Superagent = require('superagent');

require('superagent-proxy')(Superagent);

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

    var proxy = process.env.http_proxy || process.env.https_proxy;

    xray.request = function request(url, fn) {
      var req = superagent.get(url);
      if (proxy)
      var ua = xray.ua();
      if (ua) req.set('User-Agent', ua);
      if (proxy) {
        req.proxy(proxy);
      };
      req.end(function(err, res) {
        if (err) return fn(err);
        else return fn(null, res.text);
      });
    };

    return xray;
  }
}
