'use strict';
const {stripHTML,unescapeHTML}=require('hexo-util');
const array=value=>value && typeof value.toArray==='function'?value.toArray():Array.isArray(value)?value:[];
const plain=value=>unescapeHTML(stripHTML(String(value||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,''))).replace(/\s+/g,' ').trim();
const collator=new Intl.Collator('zh-CN');
function normalizePosts(input){
 return array(input).filter(p=>p.published!==false).map(p=>{
  const d=new Date(p.date.valueOf());
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  const text=plain(p.content);
  return {title:p.title||'未命名文章',url:'/'+p.path.replace(/^\//,''),date,month:date.slice(0,7),timestamp:d.getTime(),tags:[...new Set(array(p.tags).map(t=>t.name))].sort(collator.compare),text,excerpt:plain(p.description||p.excerpt)||text.slice(0,140)};
 }).sort((a,b)=>b.timestamp-a.timestamp||a.url.localeCompare(b.url,'en'));
}
function groupPosts(posts,type){
 const map=new Map();
 for(const post of posts)for(const key of type==='tags'?post.tags:[post.month]){
  if(!map.has(key))map.set(key,[]);map.get(key).push(post);
 }
 return [...map].sort(([a],[b])=>type==='tags'?collator.compare(a,b):b.localeCompare(a)).map(([key,posts])=>({key,label:type==='tags'?key:key.replace('-', ' 年 ')+' 月',posts}));
}
module.exports={normalizePosts,groupPosts};
