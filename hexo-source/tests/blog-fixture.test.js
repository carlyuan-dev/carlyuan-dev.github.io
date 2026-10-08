'use strict';
// Builds synthetic posts in a temporary site; never modifies the real blog content.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Hexo = require('hexo');
const {load} = require('cheerio');
const root = path.resolve(__dirname, '..');

test('generated site: 10-post pagination, complete indexes, Shanghai months and public-only search', {timeout:120000}, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'caoyuan-blog-fixture-'));
  let hexo;
  try {
    for (const name of ['_config.yml', '_config.butterfly.yml', 'package.json', 'themes', 'scripts', 'lib']) {
      await fs.cp(path.join(root,name), path.join(dir,name), {recursive:true});
    }
    await fs.symlink(path.join(root,'node_modules'), path.join(dir,'node_modules'),'dir');
    for(const name of ['_posts','_drafts','about']) await fs.mkdir(path.join(dir,'source',name),{recursive:true});
    for(let i=1;i<=12;i++) {
      const date = i===12 ? '2026-01-01 00:30:00' : `2025-12-${String(i).padStart(2,'0')} 12:00:00`;
      const tags = i===1 ? '[]' : i===12 ? '["中文检索", "A & B"]' : '["中文检索"]';
      await fs.writeFile(path.join(dir,'source/_posts',`post-${i}.md`), `---\ntitle: Fixture ${i}\ndate: ${date}\ntags: ${tags}\n---\n正文检索样本 ${i}。\n`);
    }
    await fs.writeFile(path.join(dir,'source/_drafts/private.md'),'---\ntitle: DRAFT_SECRET\n---\nDRAFT_SECRET');
    await fs.writeFile(path.join(dir,'source/about/index.md'),'---\ntitle: About\n---\nABOUT_INTERNAL');
    hexo = new Hexo(dir,{silent:true});
    await hexo.init();
    await hexo.call('generate');
    const read = async p => fs.readFile(path.join(dir,'public',p),'utf8');
    const home = load(await read('index.html'));
    const second = load(await read('page/2/index.html'));
    assert.equal(home('.cy-post-preview').length,10,'homepage shows ten posts');
    assert.equal(second('.cy-post-preview').length,2,'remaining posts appear on second page');
    assert.equal(home('.cy-post-preview h2').first().text(),'Fixture 12');
    assert.deepEqual(second('.cy-post-preview h2').map((i,e)=>second(e).text()).get(),['Fixture 2','Fixture 1']);
    assert.ok(home('#pagination a').toArray().some(e => new URL(home(e).attr('href'),'https://example.test').pathname === '/page/2/'),'pagination links to page two');
    const tags = load(await read('tags/index.html'));
    assert.deepEqual(tags('.cy-post-group').map((i,e)=>tags(e).attr('data-group')).get(),['中文检索','A & B']);
    assert.equal(tags('[data-group="中文检索"] .cy-post-list li').length,11);
    assert.equal(tags('[data-group="A & B"] .cy-post-list li').length,1);
    assert.ok(tags('.cy-tag-index').text().includes('A & B'),'special tag survives escaping');
    assert.equal(tags('.cy-directory h1, .cy-directory time, .cy-directory input').length,0);
    tags('.cy-tag-index a').each((i,e)=>{assert.equal(tags(tags(e).attr('href')).length,1,'index targets a group heading');});
    const archives = load(await read('archives/index.html'));
    assert.deepEqual(archives('.cy-post-group').map((i,e)=>archives(e).attr('data-group')).get(),['2026-01','2025-12']);
    assert.equal(archives('.cy-post-list li').length,12,'untagged post remains archived');
    const january = load(await read('archives/2026/01/index.html'));
    assert.deepEqual(JSON.parse(january('.cy-directory').attr('data-selected')),['2026-01']);
    const search = JSON.parse(await read('blog-search.json'));
    assert.equal(search.length,12,'search covers every published post beyond first page');
    assert.equal(search[0].date,'2026-01-01','local midnight boundary belongs to Shanghai January');
    assert.ok(search.every(p=>p.text.includes('正文检索样本')));
    assert.ok(!JSON.stringify(search).includes('DRAFT_SECRET'));
    assert.ok(!JSON.stringify(search).includes('ABOUT_INTERNAL'));
    assert.equal(search.find(p=>p.title==='Fixture 1').tags.length,0);
  } finally {
    if(hexo) await hexo.exit();
    await fs.rm(dir,{recursive:true,force:true});
  }
});
