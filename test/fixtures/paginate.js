var assert = require('assert');

exports.input = [{
  $root: '.repo-list-item',
  title: '.repo-list-name',
  link: '.repo-list-name a[href]',
  description: '.repo-list-description',
  meta: {
    $root: '.repo-list-meta',
    starredOn: 'time'
  }
}];

exports.expected = function(arr) {
  assert(arr.length >= 60, 'array length (' + arr.length + ') not large enough');
  arr.map(function(arr) {
    assert(~arr.link.indexOf('https://github.com/'), 'invalid link');
    assert(arr.title.length, 'title not there');
    assert(arr.meta.starredOn.length, 'starred on not there');
  })
}
