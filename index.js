/**
 * Module Dependencies
 */

var cheerio = require('cheerio');
var request = require('request');
var debug = require('debug')('structural');
var url = require('url');

/**
 * Export `Structural`
 */

module.exports = Structural;

/**
 * Initialize `Structural`
 */

function Structural(url) {
  if (!(this instanceof Structural)) return new Structural(url);
  this.limit = Infinity;
  this.url = url;
  this.keys = [];
}

/**
 * Key
 */

Structural.prototype.key = function(name, selector, attr) {
  this.keys.push({
    name: name,
    selector: selector,
    attr: attr
  });

  return this;
};

/**
 * json
 */

Structural.prototype.json = function(fn) {
  var paginate = this.paginateEl;
  var limit = paginate ? this.limit : 1;
  var url = this.url;
  var self = this;
  var out = [];

  debug('fetching: %s', url);
  this.get(this.url, next);

  function next(err, col, $) {
    if (err) return fn(err, stringify(out));
    out = out.concat(col);
    if (--limit <= 0) return fn(null, stringify(out));
    var href = $(paginate).attr('href');
    if (!href) return fn(null, stringify(out));
    debug('next page: %s', href);
    self.get(href, next);
  }

  function stringify(obj) {
    return JSON.stringify(obj, true, 2);
  }
}

/**
 * Get
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Structural}
 * @api private
 */

Structural.prototype.get = function(url, fn) {
  var keys = this.keys;

  request.get(url, function(err, res, body) {
    if (err) return fn(err);
    else if (res.statusCode !== 200) return fn(new Error('status code: ' + res.statusCode));
    var $ = cheerio.load(body);
    var out = [];

    absolute(url, $);

    keys.forEach(function(key) {
      $(key.selector).each(function(i, el) {
        if (!out[i]) out[i] = {};
        out[i][key.name] = key.attr ? $(el).attr(key.attr) : text([el]);
      });
    });

    return fn(null, out, $);
  });
}

/**
 * paginate
 */

Structural.prototype.paginate = function(el, limit) {
  this.paginateEl = el;
  this.limit = limit;
  return this;
};


/**
 * Change all the URLs into absolute urls
 *
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
}

/**
 * Fetch text, but trim at each node.
 *
 * @param {Array} elems
 * @return {String}
 * @api private
 */

function text(elems) {
  if (!elems) return '';

  var ret = '',
      len = elems.length,
      elem;

  for (var i = 0; i < len; i ++) {
    elem = elems[i];
    if (elem.type === 'text') ret += elem.data.trim();
    else if (elem.children && elem.type !== 'comment') {
      ret += text(elem.children);
    }
  }

  return ret;
};
