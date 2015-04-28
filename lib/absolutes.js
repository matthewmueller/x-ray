/**
 * Module Dependencies
 */

var url = require('url');

/**
 * Export `absolute`
 */

module.exports = absolute;

/**
 * Selector
 */

var selector = [
  'a[href]',
  'img[src]',
  'script[src]',
  'link[href]',
  'source[src]',
  'track[src]',
  'img[src]',
  'frame[src]',
  'iframe[src]'
].join(',')

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
  $(selector).each(abs);

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
    } else {
      var current = url.resolve(remote, parts.pathname);
      src = url.resolve(current, src);
    }

    $el.attr(key, src);
  }

  return $;
}
