'use strict';
// Build first: exercise the real template with explicit multi-group fixtures.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM,VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname,'..');
const {pageHTML} = require('./directory-fixture');
const html = pageHTML('archives');
const script = fs.readFileSync(path.join(root,'source/js/blog-navigation.js'),'utf8');
const data = [{title:'排查分词',url:'/posts/tokenization/',tags:['中文检索'],text:'正文唯一关键词：词元边界。<img src=x onerror=alert(1)>'}];
const settle = () => new Promise(resolve=>setImmediate(resolve));
function setup(fetch = async()=>({ok:true,json:async()=>data}),mobile=false,markup=html) {
  const dom = new JSDOM(markup,{url:'https://example.test/tags/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});
  const {window:w}=dom;
  w.fetch=fetch;
  w.matchMedia=()=>({matches:mobile});
  w.requestAnimationFrame=fn=>fn();
  w.HTMLElement.prototype.scrollTo=function({top}) { this.scrollTop=top; };
  w.eval(script);
  const $=selector=>w.document.querySelector(selector);
  const all=selector=>[...w.document.querySelectorAll(selector)];
  const input=value=>{$('#cy-search-input').value=value;$('#cy-search-input').dispatchEvent(new w.Event('input'));};
  return {dom,w,$,all,input};
}
test('archive index jumps inside left pane and highlights target without filtering',()=>{
  const {dom,$,all}=setup();
  try {
    const links=all('.cy-tag-index a');
    assert.ok(links.length>=2);
    links[1].click();
    assert.equal(links[1].getAttribute('aria-current'),'location');
    assert.ok(all('.cy-post-group').every(g=>!g.hidden));
    assert.equal(all('.cy-directory input, .cy-directory time, .cy-directory h1').length,0);
  } finally {dom.window.close();}
});
test('empty directories remain usable and empty search index reports no results',async()=>{
  for (const route of ['tags','archives']) {
    const {dom,$,all,input}=setup(async()=>({ok:true,json:async()=>[]}),false,pageHTML(route,true));
    try {
      assert.equal($('.cy-directory').dataset.initialized,'true');
      assert.match($('.cy-directory-content').textContent,/暂无文章/);
      assert.equal(all('.cy-post-group, .cy-tag-index a').length,0);
      $('.cy-search-open').click();await settle();input('任何内容');
      assert.match($('#cy-search-status').textContent,/没有找到/);
      assert.equal(all('#cy-search-results li').length,0);
      assert.equal($('#cy-search-retry').hidden,true);
    } finally {dom.window.close();}
  }
});
test('search empty/body/no-result states, safe text, Escape focus and filters preserved',async()=>{
  const {dom,w,$,all,input}=setup();
  try {
    const link=all('.cy-tag-index a')[0];
    link.click();
    const visible=all('.cy-post-group').map(g=>!g.hidden);
    $('.cy-search-open').click(); await settle();
    assert.equal(w.document.activeElement,$('#cy-search-input'));
    assert.match($('#cy-search-status').textContent,/输入/);
    input('词元边界');
    assert.equal(all('#cy-search-results li').length,1);
    assert.equal($('#cy-search-results a').getAttribute('href'),'/posts/tokenization/');
    assert.equal(all('#cy-search-results img').length,0,'body excerpt is text, not HTML');
    input('不存在词');assert.equal(all('#cy-search-results li').length,0);
    assert.match($('#cy-search-status').textContent,/没有找到/);
    input('');assert.match($('#cy-search-status').textContent,/输入/);
    w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
    assert.ok($('#cy-search-form').hidden && $('#cy-search-panel').hidden);
    assert.equal(w.document.activeElement,$('.cy-search-open'));
    assert.equal($('.cy-search-open').getAttribute('aria-expanded'),'false');
    assert.equal(link.getAttribute('aria-current'),'location');
    assert.deepEqual(all('.cy-post-group').map(g=>!g.hidden),visible);
  } finally {dom.window.close();}
});
test('failed index request has retry and succeeds on second request',async()=>{
  let calls=0;
  const {dom,$,all,input}=setup(async()=>++calls===1?{ok:false,status:503}:{ok:true,json:async()=>data});
  try {
    $('.cy-search-open').click();await settle();
    assert.match($('#cy-search-status').textContent,/载入失败/);
    assert.equal($('#cy-search-retry').hidden,false);
    input('词元边界');$('#cy-search-retry').click();await settle();
    assert.equal(calls,2);assert.equal($('#cy-search-retry').hidden,true);
    assert.equal(all('#cy-search-results li').length,1);
  } finally {dom.window.close();}
});
test('Chinese IME waits for composition end; mobile index remains available',async()=>{
  const {dom,w,$,all,input}=setup(undefined,true);
  try {
    assert.ok($('.cy-tag-index'));
    $('.cy-search-open').click();await settle();
    $('#cy-search-input').dispatchEvent(new w.CompositionEvent('compositionstart'));
    input('词元边界');assert.equal(all('#cy-search-results li').length,0);
    $('#cy-search-input').dispatchEvent(new w.CompositionEvent('compositionend'));
    assert.equal(all('#cy-search-results li').length,1);
    $('#cy-search-close').click();
    assert.equal(w.document.activeElement,$('.cy-search-open'));
  } finally {dom.window.close();}
});
