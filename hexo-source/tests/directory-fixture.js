'use strict';
// Keep interaction coverage independent of whatever posts happen to be published.
// Render the real directory template inside the generated page shell.
const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');
const cheerio = require('cheerio');
const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'themes/butterfly/layout/blog-directory.pug'), 'utf8')
  .split('block content\n')[1].replace(/^  /gm, '');
const posts = [
  {url:'/posts/fixture-one/',title:'目录测试文章一'},
  {url:'/posts/fixture-two/',title:'目录测试文章二'}
];
function pageHTML(route, empty = false) {
  const shell = fs.readFileSync(path.join(root, 'public', route, 'index.html'), 'utf8');
  if (!/^\/?(tags|archives)\/?$/.test(route)) return shell;
  const tags = route.includes('tags');
  const groups = empty ? [] : (tags ? ['Rag', '工具'] : ['2026-10', '2026-09']).map((key, i) => ({
    key, label:tags ? key : key.replace('-', ' 年 ') + ' 月', posts:[posts[i]]
  }));
  const directory = pug.render(template, {
    page:{title:tags ? 'Tags' : 'Archives',blogType:tags ? 'tags' : 'months',groups,selected:[]},
    url_for:url => url
  });
  const $ = cheerio.load(shell);
  if ($('.cy-directory').length !== 1) throw new Error('Built page must contain exactly one directory');
  $('.cy-directory').replaceWith(directory);
  return $.html();
}
module.exports = {pageHTML};
