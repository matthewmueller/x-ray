/**
 * Module Dependencies
 */

var url = require('url');

/**
 * Export `absolute`
 */

module.exports = absolute;

/**
 * Change all the URLs into absolute urls
 *
 * @param {String} path
 * @param {Cheerio} $
 * @return {$}
 */

function absolute(path, $) {
  var parts = url.parse(path);
  var remote = parts.protocol + '//' + parts.hostname;
  $('a[href]').each(abs);

  function abs(i, el) {
    var $el = $(el);
    var key = null;
    var src = null;

    if (src = $el.attr('href')) {
      key = 'href';
    } else if (src = $el.attr('src')) {
      key = 'src';
    } else {
      return;
    }

    src = src.trim();

    if (~src.indexOf('://')) {
      return;
    } else if (src[0] == '/') {
      src = remote + src;
    } else {
      src = remote + '/' + parts.pathname.replace(/^\//, '') + '/' + src
    }

    $el.attr(key, src);
  }

  return $;
}
