/**
 * Module dependencies
 */



/**
 * Export `Crawler`
 */

module.exports = Crawler

/**
 * Initialize `Crawler`
 */

function Crawler(state) {
  if (!(this instanceof Crawler)) return new Crawler(state)
  this.state = state
}

Crawler.prototype.click = function(selector) {

};

Crawler.prototype.evaluate = function(fn) {

}

Crawler.prototype.select = function(scope, selector) {

};

Crawler.prototype.paginate = function(selector) {

};

Crawler.prototype.run = function(fn) {

}

Crawler.prototype.then = function(fulfill, reject) {

}
