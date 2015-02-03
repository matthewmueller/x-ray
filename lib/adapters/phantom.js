	/**
	 * Module Dependencies
	 */

var Nightmare = require('nightmare');
var delegates = require('delegates');

/**
 * Export
 */

module.exports = function nightmare(opts) {
  var nightmare = Nightmare(opts);

  return function plugin(xray) {
    xray.request = request(nightmare);

    delegates(xray, 'adapter')
      .method('useragent')
      .method('viewport')
      .method('scrollTo')
      .method('refresh')
      .method('forward')
      .method('upload')
      .method('check')
      .method('click')
      .method('type')
      .method('wait')
      .method('back')

    return xray;
  }
}

/**
 * Request
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Xray}
 * @api private
 */

function request(adapter) {
  return function (url, fn) {
    adapter
      .goto(url)
      .evaluate(function() {
        return document.documentElement.outerHTML;
      }, load)
      .run(function(err) {
        if (err) return fn(err);
      });

    function load(body) {
      console.log('body!', body);
      return fn(null, body);
    }
  }
};
