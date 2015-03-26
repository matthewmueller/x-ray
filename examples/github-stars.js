/**
 * Module Dependencies
 */

var xray = require('..');

/**
 * Use
 */

xray('https://github.com/stars/matthewmueller')
  .select([{
    $root: '.repo-list-item',
    link: '.repo-list-name a[href]'
  }])
  .paginate('div.pagination > a:last-child[href]')
  .limit(3)
  .run(function(err, json) {
    if (err) throw err;
    console.log(JSON.stringify(json, true, 2));
  })
