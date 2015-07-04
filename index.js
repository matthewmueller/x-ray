/**
 * Module Dependencies
 */

var has = Object.prototype.hasOwnProperty;
var Crawler = require('x-ray-crawler');
var assign = require('object-assign');
var cheerio = require('cheerio');
var enstore = require('enstore');
var isUrl = require('is-url');
var Batch = require('batch');
var isArray = Array.isArray;
var fs = require('fs');

/**
 * Locals
 */

var absolutes = require('./lib/absolutes');
var resolve = require('./lib/resolve');
var params = require('./lib/params');
var walk = require('./lib/walk');

/**
 * Debugs
 */

var debug = require('debug')('x-ray');
var error = require('debug')('x-ray:error');

/**
 * Crawler methods
 */

var methods = [ 'concurrency', 'throttle', 'timeout', 'driver', 'delay', 'limit'];

/**
 * Export
 */

module.exports = Xray;

/**
 * Initialize X-ray
 */

function Xray() {
  var crawler = Crawler();

  function xray(source, scope, selector) {
    var args = params(source, scope, selector);
    selector = args.selector;
    source = args.source;
    scope = args.context;

    // state
    var state = assign({
      stream: false,
      concurrency: Infinity,
      paginate: false,
      limit: Infinity
    }, state || {});

    var store = enstore();
    var pages = [];
    var stream;

    function node(source2, fn) {
      if (1 == arguments.length) {
        fn = source2;
      } else {
        source = source2;
      }

      debug('params: %j', {
        source: source,
        scope: scope,
        selector: selector
      });

      if (isUrl(source)) {
        debug('starting at: %s', source);
        xray.request(source, function(err, html) {
          if (err) return next(err);
          var $ = load(html, source);
          node.html($, next);
        });
      } else if (scope && ~scope.indexOf('@')) {
        debug('resolving to a url: %s', scope)
        var url = resolve(source, false, scope);

        // ensure that a@href is a URL
        if (!isUrl(url)) {
          debug('%s is not a url!', url);
          return next(new Error(url + ' is not a URL'));
        }

        debug('resolved "%s" to a %s', scope, url);
        xray.request(url, function(err, html) {
          if (err) return next(err);
          var $ = load(html, url);
          node.html($, next);
        });
      } else {
        // `url` is probably HTML
        var $ = load(source);
        node.html($, next);
      }

      function next(err, obj, $) {
        if (err) return fn(err);
        var paginate = state.paginate;
        var limit = --state.limit;

        // create the stream
        stream = stream
          ? stream
          : paginate
          ? stream_array(state.stream)
          : stream_object(state.stream);

        if (paginate) {
          if (isArray(obj)) {
            pages = pages.concat(obj);
          } else {
            pages.push(obj);
          }

          if (limit <= 0) {
            debug('reached limit, ending');
            stream(obj, true);
            return fn(null, pages);
          }

          var url = resolve($, false, paginate);
          debug('paginate(%j) => %j', paginate, url);

          if (!isUrl(url)) {
            debug('%j is not a url, finishing up', url);
            stream(obj, true);
            return fn(null, pages);
          }

          stream(obj);

          // debug
          debug('paginating %j', url);
          isFinite(limit) && debug('%s page(s) left to crawl', limit)

          xray.request(url, function(err, html) {
            if (err) return next(err);
            var $ = load(html, url);
            node.html($, next);
          });

        } else {
          stream(obj, true);
          fn(null, obj);
        }
      }

      return node;
    }

    function load(html, url) {
      var $ = html.html ? html : cheerio.load(html);
      if (url) $ = absolutes(url, $);
      return $;
    }

    node.html = function($, fn) {
      walk(selector, function(v, k, next) {
        if ('string' == typeof v) {
          var value = resolve($, root(scope), v);
          next(null, value);
        } else if ('function' == typeof v) {
          v($, function(err, obj) {
            if (err) return next(err);
            next(null, obj);
          });
        } else if (isArray(v)) {
          if ('string' == typeof v[0]) {
            next(null, resolve($, root(scope), v));
          } else if ('object' == typeof v[0]) {
            var $scope = $.find ? $.find(scope) : $(scope);
            var pending = $scope.length;
            var out = [];

            // Handle the empty result set (thanks @jenbennings!)
            if (!pending) return next(null, out);

            $scope.each(function(i, el) {
              var $innerscope = $scope.eq(i);
              var node = xray(scope, v[0]);
              node($innerscope, function(err, obj) {
                if (err) return next(err);
                out[i] = obj;
                if (!--pending) {
                  return next(null, compact(out));
                }
              });
            });
          }
        }
      }, function(err, obj) {
        if (err) return fn(err);
        fn(null, obj, $);
      });
    }

    node.paginate = function(paginate) {
      if (!arguments.length) return state.paginate;
      state.paginate = paginate;
      return node;
    }

    node.limit = function(limit) {
      if (!arguments.length) return state.limit;
      state.limit = limit;
      return node;
    }

    node.write = function(path) {
      var ret;

      if (arguments.length) {
        ret = state.stream = fs.createWriteStream(path);
      } else {
        state.stream = store.createWriteStream();
        ret = store.createReadStream();
      }

      node(function(err) {
        if (err) state.stream.emit('error', err);
      })

      return ret;
    }

    return node;
  }

  xray.request = function(url, fn) {
    debug('fetching %s', url);
    crawler(url, function(err, ctx) {
      if (err) return fn(err);
      debug('got response for %s with status code: %s', url, ctx.status);
      return fn(null, ctx.body);
    })
  }


  methods.forEach(function(method) {
    xray[method] = function() {
      if (!arguments.length) return crawler[method]();
      crawler[method].apply(crawler, arguments);
      return this;
    };
  });

  return xray;
}

/**
 * Get the root, if there is one.
 *
 * @param {Mixed}
 * @return {Boolean|String}
 */

function root(selector) {
  return ('string' == typeof selector || isArray(selector))
    && !~selector.indexOf('@')
    && !isUrl(selector)
    && selector;
}

/**
 * Compact an array,
 * removing empty objects
 *
 * @param {Array} arr
 * @return {Array}
 */

function compact(arr) {
  return arr.filter(function(val) {
    if (null == val) return false;
    if (undefined !== val.length) return 0 !== val.length;
    for (var key in val) if (has.call(val, key)) return true;
    return false;
  });
}

/**
 * Streaming array helper
 *
 * @param {Stream} data (optional)
 */

function stream_array(stream) {
  if (!stream) return function(){};
  var first = true;

  return function _stream_array(data, end) {
    var json = JSON.stringify(data, true, 2);

    if (first) {
      stream.write('[\n');
      first = false;
    }

    if (isArray(data)) {
      json = json.slice(1, -1);
    }

    if (end) {
      stream.end(json + ']');
    } else {
      stream.write(json + ',');
    }
  }
}

/**
 * Streaming object helper
 *
 * @param {Stream} data (optional)
 * @return {Function}
 */

function stream_object(stream) {
  if (!stream) return function(){};
  var first = true;

  return function _stream_object(data, end) {
    var json = JSON.stringify(data, true, 2);

    if (end) {
      stream.end(json);
    } else {
      stream.write(json);
    }
  }
}
