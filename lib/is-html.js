/**
 * Export `isHTML`
 */

module.exports = isHTML;

/**
 * Check if the string is HTML
 */

function isHTML(str) {
  str = (str || '').toString().trim();
  return '<' == str[0]
    && '>' == str[str.length - 1];
}
