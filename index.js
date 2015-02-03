/**
 * Export `x-ray`
 */

module.exports = require('./lib/x-ray');



//                                                                                                                      /**
//  * Module Dependencies
//  */
//
// var debug = require('debug')('x-ray');
// var delegates = require('matthewmueller-delegates');
// var Selector = require('./lib/selector');
// var Nightmare = require('nightmare');
// var type = require('component-type');
// var traverse = require('traverse');
// var extend = require('extend.js');
// var cheerio = require('cheerio');
// var noop = function() {};
// var url = require('url');
// var keys = Object.keys;
// var fs = require('fs');
//
// /**
//  * Export `Xray`
//  */
//
// module.exports = Xray;
//
// /**
//  * Regexps
//  */
//
// var rselector = /([^\[]+)(?:\[([^\[]+)\])?/
//
// /**
//  * Initialize `Xray`
//  *
//  * @param {String} url
//  * @return {Xray}
//  * @api public
//  */
//
// function Xray(url) {
//   if (!(this instanceof Xray)) return new Xray(url);
//
//   this.nightmare = Nightmare();
//   this.limit = Infinity;
//   this._throws = false;
//   this._format = noop;
//   this.selects = [];
//   this.from = 5000;
//   this._end = noop;
//   this.to = 10000;
//   this.url = url;
//   this.keys = [];
// }
//
// /**
//  * Delegate to nightmare
//  */
//
// delegates(Xray.prototype, 'nightmare')
//   .method('screenshot')
//   .method('useragent')
//   .method('viewport')
//   .method('evaluate')
//   .method('refresh')
//   .method('upload')
//   .method('click')
//   .method('goto')
//   .method('type')
//   .method('wait')
//   .method('back')
//   .method('url')
//   .method('use')
//
// /**
//  * throws
//  */
//
// Xray.prototype.throws = function(throws) {
//   this._throws = !!throws;
//   return this;
// };
//
// /**
//  * Selector
//  *
//  * @param {String|Object} parent
//  * @param {Object} select
//  * @return {Xray}
//  */
//
// Xray.prototype.select = function(parent, select) {
//   if (!arguments.length) return this.selects;
//   if ('object' == typeof parent) select = parent, parent = null;
//
//   this.selects.push({
//     parent: parent,
//     select: select
//   });
//
//   return this;
// };
//
// /**
//  * Run
//  *
//  * @param {Function} fn
//  * @return {Xray}
//  * @api public
//  */
//
// Xray.prototype.run = function(fn) {
//   var selectors = this.selects;
//   var self = this;
//
//   this.request(this.url, function(err, $) {
//     if (err) return fn(err);
//     var out = {};
//
//     selectors.forEach(function(selector) {
//       var $el = selector.parent ? $(selector.parent) : $;
//
//     });
//
//     var select = Select($);
//
//     var obj = rmap(selectors, function(selector, i) {
//
//     });
//
//     // Object.keys(selectors).forEach(function(sel) {
//     //   var val = selectors[sel];
//
//     //   switch (type(val)) {
//     //     case 'string': select(val);
//     //   }
//     // })
//   })
//
//   function Select($) {
//     return function select(selector, i) {
//       if (isArray(selector)) {
//
//       }
//       var m = selector.match(rselector);
//       var $el = $(m[1]);
//       if (i === undefined) return $el.get();
//       $el = $el.eq(i);
//       if (!m[2] || m[2] == 'text') return text([$el[0]]);
//       else if (m[2] == 'html') return $el.html();
//       else return $el.attr(m[2]);
//     }
//   }
// };
//
// /**
//  * Module Dependencies
//  */
//
// var isArray = Array.isArray;
// var keys = Object.keys;
//
// /**
//  * Expose `rmap`
//  */
//
// function rmap(obj, fn, j) {
//   if ('object' == typeof obj) {
//     var ret = {};
//     keys(obj).map(function(k, i) {
//       ret[k] = rmap(obj[k], fn, k);
//     });
//     return ret;
//   } else {
//     return fn(obj, j || 0);
//   }
// }
//
// // /**
// //  * Add a property
// //  *
// //  * @param {String} name
// //  * @param {String} selector
// //  * @param {String|Function} attr
// //  * @return {Xray}
// //  * @api public
// //  */
//
// // Xray.prototype.property = function(name, selector, attr) {
// //   this.keys.push({
// //     name: name,
// //     selector: selector,
// //     attr: attr
// //   });
//
// //   return this;
// // };
//
// /**
//  * Run
//  *
//  * @param {Function} fn
//  * @return {Xray}
//  * @api public
//  */
//
// // Xray.prototype.run = function(fn) {
// //   var paginate = this.paginateEl;
// //   var limit = paginate ? this.limit : 1;
// //   var pending = this.urls.length;
// //   var throws = this._throws;
// //   var format = this._format;
// //   var urls = this.urls;
// //   var first = true;
// //   var self = this;
//
// //   urls.forEach(function(url) {
// //     debug('fetching: %s', url);
// //     self.request(url, next);
// //   });
//
// //   function next(err, arr, $) {
// //     if (err) return done(err);
//
// //     // format and call fn
// //     arr.map(function(json) {
// //       format(json);
// //       self._stream && send(json);
// //       fn(null, json);
// //     });
//
// //     if (--limit <= 0) return done(null, arr);
// //     var href = $(paginate).attr('href');
// //     if (!href) return done(null, arr);
//
// //     // wait
// //     setTimeout(function() {
// //       debug('next page: %s', href);
// //       self.request(href, next);
// //     }, self.delay());
// //   }
//
// //   function done(err, arr) {
// //     var end = self._end;
//
// //     if (err) {
// //       fn(err);
// //       if (throws) end(err);
// //       return;
// //     }
//
// //     // if we aren't paginating any further
// //     // then call the end function
// //     if (!--pending) {
// //       if (self._stream) {
// //         send();
// //         self._stream && self._stream.end();
// //       }
// //       end();
// //     }
// //   }
//
// //   function send(json) {
// //     if (first && !json) return self._stream.end();
// //     else if (!json) return self._stream.write('\n]\n');
//
// //     var str = JSON.stringify(json, true, 2);
//
// //     if (first) {
// //       self._stream.write('[\n' + str);
// //       first = false;
// //     } else {
// //       self._stream.write('\n,\n' + str);
// //     }
// //   }
//
// //   return this;
// // }
//
// // /**
// //  * Stream
// //  */
//
// // Xray.prototype.stream = function(file) {
// //   if (!arguments.length) return this._stream;
//
// //   this._stream = 'string' == typeof file
// //     ? fs.createWriteStream(file)
// //     : file;
//
// //   return this;
// // };
//
//
// /**
//  * Get
//  *
//  * @param {String} url
//  * @param {Function} fn
//  * @return {Xray}
//  * @api private
//  */
//
// Xray.prototype.request = function(url, fn) {
//   var nightmare = this.nightmare;
//   var format = this._format;
//   var keys = this.keys;
//
//   nightmare
//     .goto(url)
//     .evaluate(function() {
//       return document.documentElement.outerHTML;
//     }, load)
//     .run(function(err) {
//       if (err) return fn(err);
//     });
//
//   function load(body) {
//     try {
//       var $ = cheerio.load(body);
//       absolute(url, $);
//       noscripts($)
//     } catch (e) {
//       return fn(e);
//     }
//
//     return fn(null, $);
//   }
// };
//
// //   function response(body) {
// //     var $ = cheerio.load(body);
// //     var out = [];
//
// //     absolute(url, $);
// //     noscripts($)
//
// //     keys.forEach(function(key) {
// //       $(key.selector).each(function(i, el) {
// //         if (!out[i]) out[i] = {};
//
// //         // 3rd param
// //         if (key.attr) {
// //           // string or fn
// //           out[i][key.name] = 'string' == typeof key.attr
// //             ? $(el).attr(key.attr)
// //             : key.attr($(el), $);
// //         } else {
// //           out[i][key.name] = text([el]);
// //         }
//
// //       });
// //     });
//
// //     return fn(null, out, $);
// //   }
// // }
//
// /**
//  * Delay the next request
//  */
//
// Xray.prototype.delay = function(from, to) {
//   if (arguments.length) {
//     this.from = from;
//     this.to = to;
//     return this;
//   } else {
//     return Math.floor(Math.random() * this.to) + this.from;
//   }
// };
//
//
// /**
//  * Paginate
//  *
//  * @param {Element} el
//  * @param {Number} limit
//  * @return {Xray}
//  * @api public
//  */
//
// Xray.prototype.paginate = function(el, limit) {
//   this.paginateEl = el;
//   this.limit = limit;
//   return this;
// };
//
// /**
//  * format
//  *
//  * @param {Function} format
//  * @return {Xray}
//  * @api public
//  */
//
// Xray.prototype.format = function(format) {
//   this._format = format;
//   return this;
// };
//
// /**
//  * Specify the result as HTML
//  */
//
// Xray.prototype.html = function(template) {
//
// };
//
//
// /**
//  * End
//  */
//
// Xray.prototype.end = function(end) {
//   this._end = end;
//   return this;
// };
//
//
// /**
//  * Change all the URLs into absolute urls
//  *
//  * @param {Cheerio} $
//  * @return {$}
//  */
//
// function absolute(path, $) {
//   var parts = url.parse(path);
//   var remote = parts.protocol + '//' + parts.hostname;
//   $('a[href]').each(abs);
//
//   function abs(i, el) {
//     var $el = $(el);
//     var key = null;
//     var src = null;
//
//     if (src = $el.attr('href')) {
//       key = 'href';
//     } else if (src = $el.attr('src')) {
//       key = 'src';
//     } else {
//       return;
//     }
//
//     src = src.trim();
//
//     if (~src.indexOf('://')) {
//       return;
//     } else if (src[0] == '/') {
//       src = remote + src;
//     } else {
//       src = remote + '/' + parts.pathname.replace(/^\//, '') + '/' + src
//     }
//
//     $el.attr(key, src);
//   }
// }
//
// /**
//  * Remove any <noscript> tags
//  */
//
// function noscripts($) {
//   $('noscript').remove();
// }
//
// /**
//  * Fetch text, but trim at each node.
//  *
//  * @param {Array} elems
//  * @return {String}
//  * @api private
//  */
//
// function text(elems) {
//   if (!elems) return '';
//
//   var ret = '',
//       len = elems.length,
//       elem;
//
//   for (var i = 0; i < len; i++) {
//     elem = elems[i];
//     if (elem.type === 'text') ret += elem.data.trim();
//     else if (elem.children && elem.type !== 'comment') {
//       ret += text(elem.children);
//     }
//   }
//
//   return ret;
// };
