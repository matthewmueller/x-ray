/**
 * Module Dependencies
 */

var xray = require('..');
var write = require('fs').createWriteStream(__dirname + '/dribbble-search.json');

/**
 * Base URL
 */

var url = 'https://dribbble.com/search?q=form';

/**
 * x-ray
 */

xray(url)
  .selector('.dribbbles > li')
  .property('url', '.dribbble-img > .dribbble-link', 'href')
  .property('name', '.dribbble-img img', 'alt')
  .property('image', '.dribbble-img img', 'src')
  .paginate('.next_page')
  // .format(format)
  .run(function(err, json) {
    if (err) throw err;
    // console.log(json);
    // console.log(json);
    // console.log('called');
    // var str = JSON.stringify(arr, true, 2);
    // write(__dirname + '/dribble.json', str, 'utf8');
    // console.log('crawled!');
  })
  .end(function(err, json) {
    console.log(err, json);
  })
  .stream(write);
  // .end(function(err) {
  //   if (err) throw err;
  //   console.log('crawled');
  // });

/**
 * Images
 */

function images($el, $) {
  var imgs = [];

  $el.find('a').each(function(i, el) {
    imgs.push($(el).attr('data-src'));
  })

  return imgs;
}

/**
 * Format
 */

function format(json) {
  json.tags = json.tags.split(',');
  json.shots = +json.shots.replace(/\D+/g, '');
  json.followers = +json.followers.replace(/\D+/g, '');
}
