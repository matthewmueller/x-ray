/**
 * Module Dependencies
 */

var pd = require('pretty-data').pd;

/**
 * Export `pretty`
 */

module.exports = pretty;

/**
 * Parse the pretty data
 */

function pretty(html) {
  return pd.xml(html).replace(/\n/g, '\n  ');
}
