/**
 * Export `noscripts`
 */

module.exports = noscripts;

/**
 * Remove any <noscript> tags
 */

function noscripts($) {
  $('noscript').remove();
  return $;
}
