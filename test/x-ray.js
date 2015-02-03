/**
 * Module Dependencies
 */

var phantom = require('../lib/adapters/phantom');
var assert = require('assert');
var xray = require('..');

/**
 * Tests
 */

describe('x-ray', function() {

  describe('curl', function() {

    it('should select keys', function(done) {

      xray('http://mat.io')
        .select([{
          $root: ".item",
          link: 'a[href]',
          thumb: 'img[src]',
          content: {
            $root: '.item-content',
            title: 'h2',
            body: 'section'
          },
          tags: ['.item-tags li']
        }])
        .run(function(err, arr) {
          if (err) return done(err);
          assert.deepEqual(arr.pop(), {
            link: 'http://ift.tt/1xIsboY',
            thumb: 'http://www.google.com/s2/favicons?domain=http://ift.tt/1xIsboY',
            content:
             { title: 'The 100 Best Children\'s Books of All Time',
               body: 'Relive your childhood with TIME\'s list of the best 100 children\'s books of all time http://t.co/NEvBhNM4np http://ift.tt/1sk3xdM\n\n— TIME.com (@TIME) January 11, 2015' },
            tags: [ 'twitter' ]
          });
          done();
        });
    });

    it('should paginate', function(done) {
      xray('https://github.com/stars/matthewmueller?direction=%s&language=%s&sort=created')
        .use(phantom())
        .select([{
          $root: '.repo-list-item',
          title: '.repo-list-name',
          link: '.repo-list-name a[href]',
          description: 'repo-list-description',
          meta: {
            $root: '.repot-list-meta',
            starredOn: 'time[title]'
          }
        }])
        .paginate('.pagination a:last-child[href]')
        .limit(2)
        .run(function(err, arr) {
          if (err) return done(err);
          console.log(arr);
        })
    });
  });

  describe('phantom', function() {
    it('should select keys', function(done) {
      xray('http://mat.io')
        .use(phantom())
        .select([{
          $root: ".item",
          link: 'a[href]',
          thumb: 'img[src]',
          content: {
            $root: '.item-content',
            title: 'h2',
            body: 'section'
          },
          tags: ['.item-tags li']
        }])
        .run(function(err, arr) {
          if (err) return done(err);
          assert.deepEqual(arr.pop(), {
            link: 'http://ift.tt/1xIsboY',
            thumb: 'http://www.google.com/s2/favicons?domain=http://ift.tt/1xIsboY',
            content:
             { title: 'The 100 Best Children\'s Books of All Time',
               body: 'Relive your childhood with TIME\'s list of the best 100 children\'s books of all time http://t.co/NEvBhNM4np http://ift.tt/1sk3xdM\n\n— TIME.com (@TIME) January 11, 2015' },
            tags: [ 'twitter' ]
          })
          done();
        });
    });
  });


  it('should select collections', function() {

  })

  it('should select a collection of keys', function() {

  })
})
