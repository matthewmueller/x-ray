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
var isAttr = require('./lib/is-attr');
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
    source = args.source;
    scope = args.scope;
    selector = args.selector;

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

    function node(parent, fn) {
      if (1 == arguments.length) { // Assume this is a root node
        fn = parent;
        parent = undefined;
      }
      else if (isUrl(parent) && !source) { // this is also a root node
        source = parent;
        parent = undefined;
      }

      debug('params: %j', {
        parent: parent,
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
      }
      else if (isAttr(source)) {
        debug('resolving to a url: %s', source);

        // dynamically resolved source must have a parent context
        if (!parent) {
          debug('source %s does not have a parent context!', source);
          return next(new Error(source + ' requires a parent context for resolution'));
        }
        if (isUrl(parent)) {
          // request the parent url passed in, then re-evaluate node with html parent
          return xray.request(parent, function(err, html) {
            if (err) return done(err);
            var $ = load(html, parent);
            node($, fn)
          })
        }

        // ensure that attribute is a URL
        var url = resolve(parent, false, source);
        if (!isUrl(url)) {
          debug('%s is not a url!', url);
          return next(new Error(url + ' is not a URL'));
        }

        if (isArray(url)) {
          debug('resolved "%s" to array [%s]', source, url.join(', '));
          var b = new Batch();
          url.forEach(function(link) {
            b.push(function(done) {
              xray.request(link, function(err, html) {
                if (err) return done(err);
                var $ = load(html, link);
                node.html($, done);
              })
            })
          })
          b.end(function(err, values) {
            if (err) return next(err);
            next(null, values);
          })
        }
        else {
          debug('resolved "%s" to a %s', source, url);
          xray.request(url, function(err, html) {
            if (err) return next(err);
            var $ = load(html, url);
            node.html($, next);
          });
        }
      }
      else {
        if (parent && source) { throw new Error('Two sources of html provided. I don\'t know which to use!'); }
        var $ = load(parent || source);
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

    node.html = function($, fn) {
      if (scope && isArray(scope)) {
        var single_scope = scope[0]
        if ('string' != typeof single_scope) throw new Error('scope must be a string!')
        var $single_scope = $.find ? $.find(single_scope) : $(single_scope);
        var pending = $single_scope.length;
        var out = [];
        if (!pending) return fn(null, out);
        $single_scope.each(function(i, el) {
          var $innerscope = $single_scope.eq(i);
          var node = xray(selector);
          node($innerscope, function(err, obj) {
            if (err) return fn(err);
            out[i] = obj;
            if (!--pending) {
              return fn(null, compact(out));
            }
          });
        });
      }
      else {
        walk(selector, function(v, k, next) {
          if ('string' == typeof v) {
            var value = resolve($, root(scope), v);
            return next(null, value);
          }
          else if ('function' == typeof v) {
            $scope = $.find ? $.find(scope) : $(scope)
            v(scope ? $scope : $, function(err, obj) {
              if (err) return next(err);
              return next(null, obj);
            });
          }
          else if (isArray(v)) {
            if ('string' == typeof v[0]) {
              return next(null, resolve($, root(scope), v));
            }
            else if ('object' == typeof v[0] || 'function' == typeof v[0]) {
              var $scope = $.find ? $.find(scope) : $(scope);
              var pending = $scope.length;
              var out = [];

              // Handle the empty result set (thanks @jenbennings!)
              if (!pending) return next(null, out);

              $scope.each(function(i, el) {
                var $innerscope = $scope.eq(i);
                var node = 'object' == typeof v[0] ? xray(v[0]) : v[0];
                node($innerscope, function(err, obj) {
                  if (err) return next(err);
                  out[i] = obj;
                  if (!--pending) {
                    return next(null, compact(out));
                  }
                });
              });
            }
            else {
              return next(null, []);
            }
          }
          else {
            return next();
          }
        }, function(err, obj) {
          if (err) return fn(err);
          fn(null, obj, $);
        });
      }
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
        if (err) ret.emit('error', err);
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

  // expose crawler methods
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

/**
 * Load some html and resolve urls
 */
function load(html, url) {
  var $ = html.html ? html : cheerio.load(html);
  if (url) $ = absolutes(url, $);
  return $;
}
