const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizePosts,groupPosts}=require('../lib/blog-data');
const raw=(title,date,tags=[])=>({title,path:title+'/',date,content:'<p>中文 &amp; <b>检索</b></p><script>secret()</script>',tags:tags.map(name=>({name}))});
test('公开文章稳定倒序、上海月界和纯文本',()=>{
 const posts=normalizePosts([raw('b','2025-12-31T16:30:00Z'),raw('a','2025-12-31T16:30:00Z'),{...raw('draft','2026-01-01'),published:false}]);
 assert.deepEqual(posts.map(p=>p.title),['a','b']);assert.equal(posts[0].month,'2026-01');assert.equal(posts[0].text,'中文 & 检索');
});
test('标签去重并保留同一文章在多个分组，含中文和符号',()=>{
 const posts=normalizePosts([raw('a','2026-01-02',['RAG','中文检索','RAG','A & B']),raw('b','2026-01-01',['RAG'])]);
 const groups=groupPosts(posts,'tags');assert.equal(groups.length,3);assert.deepEqual(groups.find(g=>g.key==='RAG').posts.map(p=>p.title),['a','b']);
 assert.deepEqual(groups.map(g=>g.key),['中文检索','A & B','RAG']);
});
test('跨年同月不同组且无标签文章仍在归档',()=>{
 const posts=normalizePosts([raw('old','2025-01-01'),raw('new','2026-01-01')]);
 assert.deepEqual(groupPosts(posts,'months').map(g=>g.key),['2026-01','2025-01']);assert.deepEqual(groupPosts(posts,'tags'),[]);
 assert.deepEqual(groupPosts([],'months'),[]);
});
