var isArray = require('./util').isArray

module.exports = {
  /**
   * Streaming array helper
   *
   * @param {Stream} data (optional)
   * @return {Function}
   */
  array: function stream_array (stream) {
    if (!stream) return function () {}
    var first = true

    return function _stream_array (data, end) {
      var string = JSON.stringify(data, true, 2)
      var json = isArray(data) ? string.slice(1, -1) : string
      var empty = json.trim() === ''

      if (first && empty && !end) return
      if (first) { stream.write('[\n') }
      if (!first && !empty) { stream.write(',') }

      if (end) {
        stream.end(json + ']')
      } else {
        stream.write(json)
      }

      first = false
    }
  },

  /**
   * Streaming object helper
   *
   * @param {Stream} data (optional)
   * @return {Function}
   */
  object: function stream_object (stream) {
    if (!stream) return function () {}

    return function _stream_object (data, end) {
      var json = JSON.stringify(data, true, 2)

      if (end) {
        stream.end(json)
      } else {
        stream.write(json)
      }
    }
  },

  waitCb: function stream_callback (stream, fn) {
    fn(function (err) {
      if (err) stream.emit('error', err)
    })
  }
}
