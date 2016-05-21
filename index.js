'use strict'

var objectAssign = require('./lib/util').objectAssign
var compact = require('./lib/util').compact
var isArray = require('./lib/util').isArray
var absolutes = require('./lib/absolutes')
var streamHelper = require('./lib/stream')
var isUrl = require('./lib/util').isUrl
var Crawler = require('x-ray-crawler')
var resolve = require('./lib/resolve')
var root = require('./lib/util').root
var params = require('./lib/params')
var debug = require('debug')('x-ray')
var cheerio = require('cheerio')
var enstore = require('enstore')
var walk = require('./lib/walk')
var fs = require('fs')

var CONST = {
  CRAWLER_METHODS: ['concurrency', 'throttle', 'timeout', 'driver', 'delay', 'limit'],
  INIT_STATE: {
    stream: false,
    concurrency: Infinity,
    paginate: false,
    limit: Infinity
  }
}

function Xray (options) {
  var crawler = Crawler()
  options = options || {}
  var filters = options.filters || {}

  function xray (source, scope, selector) {
    var args = params(source, scope, selector)
    selector = args.selector
    source = args.source
    scope = args.context

    var state = objectAssign({}, CONST.INIT_STATE)
    var store = enstore()
    var pages = []
    var stream

    var walkHTML = WalkHTML(xray, selector, scope, filters)
    var request = Request(crawler)

    function node (source2, fn) {
      if (arguments.length === 1) {
        fn = source2
      } else {
        source = source2
      }

      debug('params: %j', {
        source: source,
        scope: scope,
        selector: selector
      })

      if (isUrl(source)) {
        debug('starting at: %s', source)
        request(source, function (err, html) {
          if (err) return next(err)
          var $ = load(html, source)
          walkHTML($, next)
        })
      } else if (scope && ~scope.indexOf('@')) {
        debug('resolving to a url: %s', scope)
        var url = resolve(source, false, scope, filters)

        // ensure that a@href is a URL
        if (!isUrl(url)) {
          debug('%s is not a url. Skipping!', url)
          return walkHTML(load(''), next)
        }

        debug('resolved "%s" to a %s', scope, url)
        request(url, function (err, html) {
          if (err) return next(err)
          var $ = load(html, url)
          walkHTML($, next)
        })
      } else if (source) {
        var $ = load(source)
        walkHTML($, next)
      } else {
        debug('%s is not a url or html. Skipping!', source)
        return walkHTML(load(''), next)
      }

      function next (err, obj, $) {
        if (err) return fn(err)
        var paginate = state.paginate
        var limit = --state.limit

        // create the stream
        if (!stream) {
          if (paginate) stream = streamHelper.array(state.stream)
          else stream = streamHelper.object(state.stream)
        }

        if (paginate) {
          if (isArray(obj)) {
            pages = pages.concat(obj)
          } else {
            pages.push(obj)
          }

          if (limit <= 0) {
            debug('reached limit, ending')
            stream(obj, true)
            return fn(null, pages)
          }

          var url = resolve($, false, paginate, filters)
          debug('paginate(%j) => %j', paginate, url)

          if (!isUrl(url)) {
            debug('%j is not a url, finishing up', url)
            stream(obj, true)
            return fn(null, pages)
          }

          stream(obj)

          // debug
          debug('paginating %j', url)
          isFinite(limit) && debug('%s page(s) left to crawl', limit)

          request(url, function (err, html) {
            if (err) return next(err)
            var $ = load(html, url)
            walkHTML($, next)
          })
        } else {
          stream(obj, true)
          fn(null, obj)
        }
      }

      return node
    }

    node.paginate = function (paginate) {
      if (!arguments.length) return state.paginate
      state.paginate = paginate
      return node
    }

    node.limit = function (limit) {
      if (!arguments.length) return state.limit
      state.limit = limit
      return node
    }

    node.stream = function () {
      state.stream = store.createWriteStream()
      var rs = store.createReadStream()
      streamHelper.waitCb(rs, node)
      return rs
    }

    node.write = function (path) {
      if (!arguments.length) return node.stream()
      state.stream = fs.createWriteStream(path)
      streamHelper.waitCb(state.stream, node)
      return state.stream
    }

    return node
  }

  CONST.CRAWLER_METHODS.forEach(function (method) {
    xray[method] = function () {
      if (!arguments.length) return crawler[method]()
      crawler[method].apply(crawler, arguments)
      return this
    }
  })

  return xray
}

function Request (crawler) {
  return function request (url, fn) {
    debug('fetching %s', url)
    crawler(url, function (err, ctx) {
      if (err) return fn(err)
      debug('got response for %s with status code: %s', url, ctx.status)
      return fn(null, ctx.body)
    })
  }
}

function load (html, url) {
  html = html || ''
  var $ = html.html ? html : cheerio.load(html)
  if (url) $ = absolutes(url, $)
  return $
}

function WalkHTML (xray, selector, scope, filters) {
  return function walkHTML ($, fn) {
    walk(selector, function (v, k, next) {
      if (typeof v === 'string') {
        var value = resolve($, root(scope), v, filters)
        return next(null, value)
      } else if (typeof v === 'function') {
        return v($, function (err, obj) {
          if (err) return next(err)
          return next(null, obj)
        })
      } else if (isArray(v)) {
        if (typeof v[0] === 'string') {
          return next(null, resolve($, root(scope), v, filters))
        } else if (typeof v[0] === 'object') {
          var $scope = $.find ? $.find(scope) : $(scope)
          var pending = $scope.length
          var out = []

          // Handle the empty result set (thanks @jenbennings!)
          if (!pending) return next(null, out)

          $scope.each(function (i, el) {
            var $innerscope = $scope.eq(i)
            var node = xray(scope, v[0])
            node($innerscope, function (err, obj) {
              if (err) return next(err)
              out[i] = obj
              if (!--pending) {
                return next(null, compact(out))
              }
            })
          })
          // Nested crawling broken on 'master'. When to merge 'bugfix/nested-crawling' #111, Needed to exit this without calling next, the problem was that it returned to the "finished" callback before it had retrived all pending request. it should wait for "return next(null, compact(out))"
          return
        }
      }
      return next()
    }, function (err, obj) {
      if (err) return fn(err)
      fn(null, obj, $)
    })
  }
}

module.exports = Xray
