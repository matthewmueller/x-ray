/**
 * Module Dependencies
 */

var xray = require('..');
var array = require('array');
var fmt = require('util').format;

/**
 * Urls
 */

var languages = [
  'JavaScript',
  'CSS',
  'CoffeeScript',
  'Ruby',
  'Python',
  'Shell',
  'Go',
  'C',
  'C++',
  'Objective-C',
  'PHP',
  'VimL',
  'Java',
  'Swift',
  'Scala',
  'TeX',
  'Perl',
  'Lua',
  'Clojure',
  'IDL',
  'Objective-C++',
  'Processing',
  'R',
  'Vala',
  'Lisp',
  'XSLT',
  'LiveScript',
  'TypeScript'
];

/**
 * Get the urls
 */

var base = 'https://github.com/stars/matthewmueller?direction=%s&language=%s&sort=created';
var urls = [];
languages.forEach(function(language) {
  language = decodeURIComponent(language);
  urls.push(fmt(base, 'asc', language));
  urls.push(fmt(base, 'desc', language));
})

/**
 * Use
 */

xray(urls)
  .key('repo', 'div > ul > li.repo-list-item.public.source > h3.repo-list-name > a')
  .key('url', 'div > ul > li.repo-list-item.public.source > h3.repo-list-name > a', 'href')
  .key('author', 'ul > li.repo-list-item.public.source > h3.repo-list-name > a > span.prefix')
  .key('description', 'div > div > ul > li > p.repo-list-description')
  .key('time', '.repo-list-meta time', 'datetime')
  .paginate('div.pagination > a:last-child')
  .json(function(err, json) {
    if (err) throw err;
    json = array(json).unique('repo').toArray();
    console.log(JSON.stringify(json, true, 2));
  })
