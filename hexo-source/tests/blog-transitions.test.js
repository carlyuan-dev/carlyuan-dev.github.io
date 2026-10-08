'use strict';
// Build first: transitions exercise real page shells and directory markup.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const {pageHTML:html} = require('./directory-fixture');
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
const response = route => ({ok:true, text:async () => html(route)});
function setup(handler = async route => response(route)) {
  const dom = new JSDOM(html(''), {url:'https://example.test/', runScripts:'outside-only', virtualConsole:new VirtualConsole()});
  const w = dom.window;
  const calls = [];
  w.fetch = async (url, options) => { calls.push(url); return handler(url, options); };
  w.matchMedia = () => ({matches:true});
  w.requestAnimationFrame = callback => callback();
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollTo = function ({top}) {this.scrollTop = top;};
  for (const file of ['blog-navigation.js', 'blog-transitions.js']) w.eval(fs.readFileSync(path.join(root, 'source/js', file), 'utf8'));
  const $ = selector => w.document.querySelector(selector);
  const click = route => {const link = [...w.document.querySelectorAll('.cy-nav-links a')].find(a => new URL(a.href).pathname === route); assert.ok(link, `navigation link ${route}`);link.click();};
  return {dom,w,$,click,calls};
}
test('navigation preserves the shell, updates title/history and reinitializes directory and search', async () => {
  const {dom,w,$,click} = setup(async route => route === '/blog-search.json' ? {ok:true,json:async () => [{title:'测试文章',tags:['Rag'],text:'测试正文',url:'/posts/test/'}]} : response(route));
  try {
    const nav = $('#nav'), input = $('#cy-search-input');
    click('/tags/'); await settle();
    assert.equal($('#nav'), nav);
    assert.equal(w.location.pathname, '/tags/');
    assert.equal(w.document.title, new w.DOMParser().parseFromString(html('/tags/'), 'text/html').title);
    assert.equal(w.history.state.blogRoute, '/tags/');
    assert.equal($('.cy-directory').dataset.initialized, 'true');
    const links = [...w.document.querySelectorAll('.cy-tag-index a')];
    assert.equal(links.length, 2, 'explicit multi-tag fixture rendered by the real template');
    links[1].click();
    assert.equal(links[1].getAttribute('aria-current'), 'location');
    click('/archives/'); await settle();
    assert.equal($('.cy-directory').dataset.initialized, 'true');
    assert.equal($('#cy-search-input'), input);
    $('.cy-search-open').click(); await settle();
    input.value = '正文'; input.dispatchEvent(new w.Event('input'));
    assert.equal($('#cy-search-results a').textContent, '测试文章');
    w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
    assert.equal($('#cy-search-form').hidden, true);
    assert.equal(w.document.activeElement, $('.cy-search-open'));
  } finally {w.close();}
});
test('failed page fetch keeps existing content and URL; retry works and later visits use cache', async () => {
  let attempts = 0;
  const {w,$,click,calls} = setup(async route => route === '/tags/' && ++attempts === 1 ? {ok:false,status:503} : response(route));
  try {
    const content = $('#content-inner').innerHTML;
    click('/tags/'); await settle();
    assert.equal(w.location.pathname, '/');
    assert.equal($('#content-inner').innerHTML, content);
    assert.match($('.cy-route-status').textContent, /失败/);
    assert.equal($('#nav').hasAttribute('aria-busy'), false);
    click('/tags/'); await settle();
    assert.equal(w.location.pathname, '/tags/');
    click('/about/'); await settle();
    click('/tags/'); await settle();
    assert.equal(calls.filter(url => url === '/tags/').length, 2);
    assert.equal($('.cy-route-status').hidden, true);
  } finally {w.close();}
});
test('latest navigation wins even if an aborted fetch resolves late', async () => {
  let resolveTags, tagSignal;
  const {w,$,click} = setup((route,options) => route === '/tags/' ? new Promise(resolve => {resolveTags=resolve;tagSignal=options.signal;}) : response(route));
  try {
    click('/tags/'); click('/archives/'); await settle();
    assert.equal(tagSignal.aborted, true);
    assert.equal(w.location.pathname, '/archives/');
    resolveTags(response('/tags/')); await settle();
    assert.equal(w.location.pathname, '/archives/');
    assert.equal($('.cy-directory').dataset.kind, 'months');
    assert.equal($('#nav').hasAttribute('aria-busy'), false);
  } finally {w.close();}
});
test('browser back restores the previous route and independent pane scroll positions', async () => {
  const {w,$,click} = setup();
  try {
    click('/tags/'); await settle();
    $('.cy-directory-content').scrollTop = 120;
    $('.cy-tag-index').scrollTop = 25;
    $('.cy-directory-content').dispatchEvent(new w.Event('scroll'));
    click('/archives/'); await settle();
    const popped = new Promise(resolve => w.addEventListener('popstate', resolve, {once:true}));
    w.history.back(); await popped; await settle();
    assert.equal(w.location.pathname, '/tags/');
    assert.equal($('.cy-directory-content').scrollTop, 120);
    assert.equal($('.cy-tag-index').scrollTop, 25);
  } finally {w.close();}
});
test('clicking the current page cancels a pending navigation', async () => {
  let resolveTags, tagSignal;
  const {w,$,click} = setup((route,options) => route === '/tags/' ? new Promise(resolve => {resolveTags=resolve;tagSignal=options.signal;}) : response(route));
  try {
    const content = $('#content-inner').innerHTML;
    click('/tags/');
    assert.equal($('#nav').getAttribute('aria-busy'), 'true');
    click('/');
    assert.equal(tagSignal.aborted, true);
    assert.equal($('#nav').hasAttribute('aria-busy'), false);
    assert.equal($('.cy-route-status').hidden, true);
    resolveTags(response('/tags/')); await settle();
    assert.equal(w.location.pathname, '/');
    assert.equal($('#content-inner').innerHTML, content);
    assert.equal(w.history.length, 1);
  } finally {w.close();}
});
