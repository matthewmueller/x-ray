/**
 * Module Dependencies
 */

var isObject = require('./util').isObject
var Batch = require('batch')

/**
 * Walk
 */

module.exports = walk

/**
 * Walk recursively, providing
 * callbacks for each step.
 *
 * @param {Mixed} value
 * @param {Function} fn
 * @param {Function} done
 * @param {String} key (private)
 */

function walk (value, fn, done, key) {
  var batch = Batch()
  var out

  if (isObject(value)) {
    out = {}
    Object.keys(value).forEach(function (k) {
      var v = value[k]
      batch.push(function (next) {
        walk(v, fn, function (err, value) {
          if (err) return next(err)
          // ignore undefined values
          if (undefined !== value && value !== '') {
            out[k] = value
          }
          next()
        }, k)
      })
    })
  } else {
    out = null
    batch.push(function (next) {
      fn(value, key, function (err, v) {
        if (err) return next(err)
        out = v
        next()
      })
    })
  }

  batch.end(function (err) {
    if (err) return done(err)
    return done(null, out)
  })
}
