
Structural
  .url('https://github.com/stars/matthewmueller?direction=asc&language=javascript&sort=created')
  .url('https://github.com/stars/matthewmueller?direction=desc&language=javascript&sort=created')
  .key('title', 'div > ul > li.repo-list-item.public.source > h3.repo-list-name > a')
  .key('url', 'div > ul > li.repo-list-item.public.source > h3.repo-list-name > a', 'href')
  .key('author', 'ul > li.repo-list-item.public.source > h3.repo-list-name > a > span.prefix')
  .key('description', 'div > div > ul > li > p.repo-list-description')
  .paginate('div.pagination > a:last-child')
  .json(function(err, json) {
    if (err) throw err;
    console.log(json);
  })
