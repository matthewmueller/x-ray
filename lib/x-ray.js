/**
 * Module Dependencies
 */

var debug = require('debug')('x-ray');
var Select = require('x-ray-select');
var request = require('./request');
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
    debug('appending json');
    out = out.concat(json);
    pop = first && !isArray(json) ? true : false;
    first = false;
  }

  function done(err) {
    debug('finishing up');
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
 *
 * @param {String|Stream} file
 * @return {Stream}
 */

Xray.prototype.write = function(file) {
  var stream = 'string' == typeof file ? fs.createWriteStream(file) : file;
  var written = false;

  this.traverse(next, done);

  return stream;

  function next(json) {
    debug('writing to the stream');
    var str = JSON.stringify(json, true, 2).slice(1, -1);
    if (!written) stream.write('[\n' + str);
    else stream.write('\n,\n' + str);
    written = true;
  }

  function done(err) {
    if (err) {
      stream.emit('error', err);
      stream.end();
      return;
    }

    debug('finishing up');
    if (written) stream.write('\n]\n');
    stream.end();
    return;
  }
}

/**
 * Traverse
 */

Xray.prototype.traverse = function(fn, done) {
  var get = this.request ? this.request : (this.request = this.use(request()).request);
  var limit = this._paginate ? this._limit : 1;
  var paginate = this._paginate;
  var selects = this.selects;
  var throws = this._throws;
  var url = this.url;
  var self = this;

  // initial request
  debug('initial request: %s', url);
  get(url, next);

  function next(err, body) {
    if (err && throws) return done(err);
    debug('received response');

    var $ = load(body);
    var select = Select($);
    var json = select(selects);
    var href = select(paginate);

    // check the pagination
    if (--limit <= 0) {
      debug('reached limit, finishing up.');
      return fn(json), done(null);
    }

    if (!href) {
      debug('no next page, finishing up.')
      return fn(json), done(null);
    }

    // callback and continue
    fn(json);

    // delay
    setTimeout(function() {
      debug('requesting next page: %s', href);
      get(href, next);
    }, self.delay());
  }

  function load(body) {
    debug('loading body');
    var $;

    // sanitize
    try {
      $ = cheerio.load(body);
      $ = absolutes(url, noscript($));
    } catch (e) {
      debug('load error: %s', e.message);
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
    this.to = to || from;
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
