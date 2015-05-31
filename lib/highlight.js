/**
 * Module Dependencies
 */

var debug = require('debug')('highlight');
var parse = require('x-ray-parse');
var chalk = require('chalk');
var isArray = Array.isArray;

/**
 * Export `highlight`
 */

module.exports = highlight;

/**
 * Initialize `highlight`
 *
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String} selector
 * @return {String}
 * @api public
 */

function highlight($, scope, selector) {
  var array = isArray(selector)
  var obj = parse(array ? selector[0] : selector);
  obj.attribute = obj.attribute || 'text';

  if (!obj.selector) {
    obj.selector = scope;
    scope = null;
  }

  return find($, scope, array ? [obj.selector] : obj.selector, obj.attribute)
}

/**
 * Find the node(s)
 *
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {String} attr
 * @return {Array|String}
 */

function find($, scope, selector, attr) {
  if (scope && isArray(selector)) {
    var $scope = select($, scope);
    $scope.map(function(i) {
      var $el = $scope.eq(i);
      var $children = select($el, selector[0]);
      $children.map(function(i) {
        attribute($children.eq(i), attr);
      });
    });
    return $;
  } else if (scope) {
    var $scope = select($, scope);
    attribute($scope.find(selector).eq(0), attr);
    return $;
  } else {
    if (isArray(selector)) {
      var $selector = select($, selector[0]);
      $selector.map(function(i) {
        attribute($selector.eq(i), attr);
      })
      return $;
    } else {
      var $selector = select($, selector);
      attribute($selector.eq(0), attr);
      return $;
    }
  }
}

/**
 * Selector abstraction, deals
 * with various instances of $
 *
 * @param {Cheerio} $
 * @param {String} selector
 * @return {Cheerio}
 */

function select($, selector) {
  if ($.is && $.is(selector)) return $;
  return $.find ? $.find(selector) : $(selector);
}

/**
 * Select the attribute based on `attr`
 *
 * @param {Cheerio} $
 * @param {String} attr
 * @return {String}
 */

function attribute($el, attr) {
  switch(attr) {
    case 'html':
      var html = $el.html();
      html = chalk.red(html);
      $el.html(html);
      break;
    case 'text':
      var text = $el.text();
      text = chalk.red(text);
      $el.text(text);
      break;
    default:
      var val = $el.attr(attr);
      $el.attr(attr, chalk.red(val));
      break;
  }
}
