var assert = require('assert');

exports.input = '.pagehead strong';

exports.expected = function(arr) {
  assert(arr.length === 2, 'array length (' + arr.length + ') incorrect');
  arr.forEach(function(item) {
    assert.equal(item, '(Matthew Mueller)');
  });
}
