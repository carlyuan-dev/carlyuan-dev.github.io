'use strict';
const {normalizePosts,groupPosts}=require('../lib/blog-data');
const migrated=['notes/','projects/','experiments/','projects/deeptutor-hkdse/','projects/chartmind-vl/','2026/07/20/restart-blog-agent-rag/','2026/07/21/agent-native-architecture-notes/','2026/07/22/rag-small-corpus-retrieval-notes/','categories/','categories/学习记录/'];
hexo.extend.helper.register('blog_posts',posts=>normalizePosts(posts || hexo.locals.get('posts')));
hexo.on('ready',()=>{
 hexo.extend.generator.register('tag',locals=>{
  const groups=groupPosts(normalizePosts(locals.posts),'tags');
  return locals.tags.toArray().map(tag=>({path:tag.path+'index.html',layout:'blog-directory',data:{layout:'page',title:'Tags',aside:false,top_img:false,blogType:'tags',groups,selected:[tag.name]}}));
 });
 hexo.extend.generator.register('archive',locals=>{
  const groups=groupPosts(normalizePosts(locals.posts),'months');
  const page=(path,selected=[])=>({path:path+'index.html',layout:'blog-directory',data:{layout:'page',title:'Archives',aside:false,top_img:false,blogType:'months',groups,selected}});
  return [page('archives/'),...groups.map(g=>page('archives/'+g.key.replace('-','/')+'/',[g.key])),...[...new Set(groups.map(g=>g.key.slice(0,4)))].map(y=>page('archives/'+y+'/',groups.filter(g=>g.key.startsWith(y+'-')).map(g=>g.key)))];
 });
});
hexo.extend.generator.register('blog-pages',locals=>{
 const posts=normalizePosts(locals.posts);
 return [
  ...(!posts.length ? [{path:'index.html',layout:'index',data:{layout:'home',posts:locals.posts,total:0,current:1}}] : []),
  {path:'tags/index.html',layout:'blog-directory',data:{layout:'page',title:'Tags',aside:false,top_img:false,blogType:'tags',groups:groupPosts(posts,'tags'),selected:[]}},
  {path:'blog-search.json',data:JSON.stringify(posts)},
  ...migrated.map(path=>({path:path+'index.html',layout:'blog-moved',data:{layout:'page',title:'页面已调整',blogMoved:true,aside:false,top_img:false}}))
 ];
});
