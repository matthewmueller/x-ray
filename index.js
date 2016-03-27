'use strict'

var objectAssign = require('./lib/util').objectAssign
var isFunction = require('./lib/util').isFunction
var isString = require('./lib/util').isString
var isObject = require('./lib/util').isObject
var compact = require('./lib/util').compact
var isArray = require('./lib/util').isArray
var absolutes = require('./lib/absolutes')
var streamHelper = require('./lib/stream')
var isUrl = require('./lib/util').isUrl
var Crawler = require('x-ray-crawler')
var resolve = require('./lib/resolve')
var root = require('./lib/util').root
var params = require('./lib/params')
var cheerio = require('cheerio')
var enstore = require('enstore')
var walk = require('./lib/walk')
var fs = require('fs')

var debug = require('debug')('x-ray')
var debugRequest = require('debug')('x-ray:request')
var debugWalk = require('debug')('xray:walkHTML')

var CONST = {
  CRAWLER_METHODS: ['concurrency', 'throttle', 'timeout', 'driver', 'delay', 'limit'],
  INIT_STATE: {
    stream: false,
    concurrency: Infinity,
    paginate: false,
    limit: Infinity
  }
}

var crawler = Crawler()

function xray (source, scope, selector) {
  var args = params(source, scope, selector)
  selector = args.selector
  source = args.source
  scope = args.context

  var state = objectAssign({}, CONST.INIT_STATE)
  var store = enstore()
  var pages = []
  var stream

  var walkHTML = WalkHTML(xray, selector, scope)
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
      debug('detected URL')
      request(source, function (err, html) {
        if (err) return next(err)
        var $ = load(html, source)
        walkHTML($, next)
      })
    } else if (scope && ~scope.indexOf('@')) {
      debug('resolving to a url: %s', scope)
      var url = resolve(source, false, scope)

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
      debug('detected source')
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

        var url = resolve($, false, paginate)
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

function Request (crawler) {
  return function request (url, fn) {
    debugRequest('fetching %s', url)
    crawler(url, function (err, ctx) {
      if (err) return fn(err)
      debugRequest('got response for %s with status code: %s', url, ctx.status)
      return fn(null, ctx.body)
    })
  }
}

function load (html, url) {
  var $ = html.html ? html : cheerio.load(html)
  if (url) $ = absolutes(url, $)
  return $
}

function WalkHTML (xray, selector, scope) {
  debugWalk('bind')
  debugWalk('selector: %j', selector)
  debugWalk('scope: %s', scope)

  return function walkHTML ($, fn) {
    debugWalk('start a new walk')

    walk(selector, function (v, k, next) {
      debugWalk('structure: %j', v)
      debugWalk('data: %j', k)

      function walkFromArray (v, next) {
        if (isString(v[0])) {
          return walkFromString(v, next)
        } else if (isArray(v[0]) || isObject(v[0])) {
          debugWalk('walk is collection')
          var $scope = $.find ? $.find(scope) : $(scope)
          var pending = $scope.length
          var out = []

          if (!pending) return next(null, out)

          $scope.each(function (i, el) {
            var $innerscope = $scope.eq(i)
            var node = xray(scope, v[0])
            node($innerscope, function (err, obj) {
              if (err) return next(err)
              out[i] = obj
              if (!--pending) return next(null, compact(out))
            })
          })
        }
      }

      function walkFromString (v, next) {
        debugWalk('walk is string')
        var value = resolve($, root(scope), v)
        return next(null, value)
      }

      function walkFromFunction (v, next) {
        debugWalk('walk is function')
        return v($, next)
      }

      if (isString(v)) {
        return walkFromString(v, next)
      } else if (isArray(v)) {
        return walkFromArray(v, next)
      } else if (isFunction(v)) {
        return walkFromFunction(v, next)
      }

      debugWalk('not detected walk')
      return next()
    }, function (err, obj) {
      return fn(err, obj, $)
    })
  }
}

module.exports = xray
