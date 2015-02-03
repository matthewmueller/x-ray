/**
 * Module Dependencies
 */

var debug = require('debug')('x-ray');
var curl = require('./adapters/curl.js');
var assign = require('object-assign');
var Select = require('x-ray-select');
var cheerio = require('cheerio');
var isArray = Array.isArray;
var noop = function() {};
var url = require('url');
var keys = Object.keys;
var fs = require('fs');

/**
 * Filters
 */

var absolutes = require('./utils/absolute-urls');
var noscript = require('./utils/noscript');

/**
 * Export `x-ray`
 */

module.exports = Xray;

/**
 * Initialize `Xray`
 *
 * @param {String} url
 * @return {Xray}
 * @api public
 */

function Xray(url) {
  if (!(this instanceof Xray)) return new Xray(url);

  this._paginate = false;
  this._limit = Infinity;
  this._throws = true;
  this.selects = {};
  this._end = noop;
  this.url = url;
  this.keys = [];
  this.from = 0;
  this.to = 0;
}

/**
 * Select
 *
 * @param {Object|Array} select
 * @return Xray
 * @api public
 */

Xray.prototype.select = function(select) {
  this.selects = select;
  return this;
}

/**
 * Run
 */

Xray.prototype.run = function(fn) {
  var first = true;
  var pop = false;
  var out = [];

  this.traverse(next, done);

  // each selection
  function next(json) {
    out = out.concat(json);
    pop = first && !isArray(json) ? true : false;
    first = false;
  }

  function done(err) {
    if (err) return fn(err);

    // if we only have one item and it's not an array,
    // then pop
    return pop
      ? fn(null, out.pop())
      : fn(null, out);
  }
}

/**
 * Write
 */

Xray.prototype.write = function(file) {
  var stream = 'string' == typeof file ? fs.createWriteStream(file) : file;
  var written = true;

  this.traverse(next, done);

  function next(json) {
    var str = JSON.stringify(json, true, 2);
    if (!written) stream.write('[\n' + str);
    else stream.write('\n,\n' + str);
    written = true;
  }

  function done(err) {
    if (err) throw err;

    if (written) stream.write('\n]\n');
    stream.end();
  }
}

/**
 * Traverse
 */

Xray.prototype.traverse = function(fn, done) {
  var request = this.request ? this.request : (this.request = this.use(curl()).request);
  var limit = this.paginateEl ? this._limit : 1;
  var paginate = this.paginateEl;
  var throws = this._throws;
  var selects = this.selects;
  var url = this.url;
  var self = this;

  // initial request
  request(url, next);

  function next(err, body) {
    if (err && throws) return done(err);
    console.log(body);

    var $ = load(body);
    var select = Select($.html());
    var json = select(selects);

    // check the pagination
    if (--limit <= 0) return fn(json), done(null);
    var href = select(paginate);
    if (!href) return fn(json), done(null);

    // callback and continue
    fn(json);

    // delay
    setTimeout(function() {
      debug('next page: %s', href);
      request(href, next);
    }, self.delay());
  }

  function load(body) {
    var $;

    // sanitize
    try {
      $ = cheerio.load(body);
      $ = absolutes(url, noscript($));
    } catch (e) {
      if (throws) return done(e);
    }

    return $;
  }
};

/**
 * Use
 */

Xray.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * throws
 */

Xray.prototype.throws = function(throws) {
  this._throws = !!throws;
  return this;
};

/**
 * Delay the next request
 */

Xray.prototype.delay = function delay(from, to) {
  if (arguments.length) {
    this.from = from;
    this.to = to;
    return this;
  } else {
    return Math.floor(Math.random() * this.to) + this.from;
  }
};

/**
 * Paginate
 *
 * @param {String} el
 * @return {Xray}
 * @api public
 */

Xray.prototype.paginate = function(el) {
  this._paginate = el;
  return this;
};

/**
 * A maximum number of pages to traverse
 *
 * @param {Number} limit
 * @return {Xray}
 * @api public
 */

Xray.prototype.limit = function(n) {
  this._limit = n;
  return this;
};
