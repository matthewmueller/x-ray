/**
 * Module Dependencies
 */

var debug = require('debug')('x-ray');
var Select = require('x-ray-select');
var request = require('./request');
var yieldly = require('yieldly');
var cheerio = require('cheerio');
var isArray = Array.isArray;
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


  this._format = function(o) { return o };
  this._paginate = false;
  this._limit = Infinity;
  this._throws = true;
  this.selects = {};
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
 * Add a plugin
 *
 * @param {Function} fn
 * @retun {Xray}
 * @api public
 */

Xray.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Throw errors or not
 *
 * @param {Boolean} throws
 * @return {Boolean|Xray}
 * @api public
 */

Xray.prototype.throws = function(throws) {
  if (!arguments.length) return this._throws;
  this._throws = !!throws;
  return this;
};

/**
 * Delay the next request between
 * `from` and `to` ms
 *
 * @param {Number} from
 * @param {Number} to
 * @return {Xray|Number}
 * @api public
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
 * Format the output
 *
 * @param {Function} fn;
 * @return {Xray}
 * @api public
 */

Xray.prototype.format = function(fn) {
  if (!arguments.length) return this._format;
  this._format = fn;
  return this;
};


/**
 * Paginate
 *
 * @param {String} el
 * @return {Xray}
 * @api public
 */

Xray.prototype.paginate = function(el) {
  if (!arguments.length) return this._paginate;
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
  if (!arguments.length) return this._limit;
  this._limit = n;
  return this;
};

/**
 * Run `x-ray`
 *
 * @param {Function} fn
 * @return Xray
 */

Xray.prototype.run = yieldly(function(fn) {
  var first = true;
  var pop = false;
  var out = [];

  this.traverse(next, done);
  return this;

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
});

/**
 * Write
 *
 * @param {String|Stream} file
 * @return {Stream}
 * @api public
 */

Xray.prototype.write = function(file) {
  var stream = 'string' == typeof file ? fs.createWriteStream(file) : file;
  var haspagination = !!this._paginate;
  var isarray = isArray(this.selects)
  var written = false;

  this.traverse(next, done);
  return stream;

  function next(json) {
    debug('writing to the stream');
    var str = 'string' == typeof json ? json : JSON.stringify(json, true, 2)

    // handle arrays
    if (isarray || haspagination) {
      str = isarray ? str.slice(1, -1) : str;
      if (!written) stream.write('[\n' + str);
      else stream.write('\n,\n' + str);
    } else {
      stream.write(str);
    }

    written = true;
  }

  function done(err) {
    if (err) {
      stream.emit('error', err);
      end(stream);
      return;
    }

    debug('finishing up');
    if ((isarray || haspagination) && written) stream.write('\n]\n');
    end(stream);
    return;
  }

  function end(stream) {
    // TODO: figure out how to determine
    // if stream is stdio.
    if (stream._isStdio) {
      stream.emit('close');
    } else {
      stream.end();
    }
  }
}

/**
 * Traverse the pages
 *
 * @param {Function} fn
 * @param {Function} done
 * @api private
 */

Xray.prototype.traverse = function(fn, done) {
  var get = this.request ? this.request : (this.request = this.use(request()).request);
  var limit = this._paginate ? this._limit : 1;
  var paginate = this._paginate;
  var selects = this.selects;
  var throws = this._throws;
  var format = this._format;
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

    // support formatting
    json = isArray(json) ? json.map(format) : format(json);

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
