(() => {
  const routes = ['/', '/tags/', '/archives/', '/about/'];
  const route = path => path === '/index.html' ? '/' : path;
  if (!routes.includes(route(location.pathname))) return;
  const cache = new Map();
  let current = route(location.pathname), revision = 0, controller;
  let animations = [];
  const nav = document.querySelector('#nav');
  const status = document.createElement('p');
  status.className = 'cy-route-status'; status.setAttribute('role', 'status'); status.hidden = true;
  nav.append(status);
  const snapshot = () => ({
    blogRoute: current, scroll: window.scrollY,
    left: document.querySelector('.cy-directory-content')?.scrollTop || 0,
    right: document.querySelector('.cy-tag-index')?.scrollTop || 0
  });
  history.replaceState({...history.state, ...snapshot()}, '', location.href);
  history.scrollRestoration = 'manual';
  const remember = () => {
    if (route(location.pathname) === current) history.replaceState({...history.state, ...snapshot()}, '', location.href);
  };
  document.addEventListener('scroll', remember, {capture:true, passive:true});
  const fetchPage = async (url, signal) => {
    if (cache.has(url.pathname)) return cache.get(url.pathname);
    const response = await fetch(url.pathname, {signal});
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url.pathname}`);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    if (!doc.querySelector('#content-inner') || !doc.querySelector('#page-header')) throw new Error('Missing page structure');
    cache.set(url.pathname, doc);
    return doc;
  };
  const navigate = async (url, saved) => {
    const token = ++revision;
    controller?.abort(); controller = new AbortController();
    animations.forEach(animation => animation.cancel()); animations = [];
    status.hidden = false; status.textContent = '正在载入…';
    nav.setAttribute('aria-busy', 'true');
    try {
      const doc = await fetchPage(url, controller.signal);
      if (token !== revision) return;
      const direction = routes.indexOf(route(url.pathname)) >= routes.indexOf(current) ? 1 : -1;
      const main = document.querySelector('#content-inner');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced && main.animate) {
        const out = main.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction * 45}px)`}],{duration:110,easing:'ease-in',fill:'forwards'});
        animations.push(out); await out.finished.catch(()=>{});
      }
      if (token !== revision) return;
      if (!saved) { remember(); history.pushState({blogRoute:route(url.pathname)}, '', url); }
      current = route(url.pathname);
      const header = document.querySelector('#page-header');
      const nextHeader = doc.querySelector('#page-header');
      [...header.children].filter(child=>child!==nav).forEach(child=>child.remove());
      header.className = nextHeader.className;
      header.setAttribute('style', nextHeader.getAttribute('style') || '');
      [...nextHeader.children].filter(child=>child.id!=='nav').forEach(child=>header.append(child.cloneNode(true)));
      // The subtitle is normally filled by a page-specific inline script.
      const subtitle = header.querySelector('#subtitle');
      if (subtitle && !subtitle.textContent) subtitle.textContent = 'Code is cheap. Show me the idea.';
      main.className = doc.querySelector('#content-inner').className;
      main.innerHTML = doc.querySelector('#content-inner').innerHTML;
      document.querySelector('#footer').innerHTML = doc.querySelector('#footer').innerHTML;
      document.querySelector('#body-wrap').className = doc.querySelector('#body-wrap').className;
      document.title = doc.title;
      for (const selector of ['link[rel="canonical"]','meta[name="description"]']) {
        const incoming = doc.querySelector(selector), existing = document.querySelector(selector);
        if (incoming && existing) existing.replaceWith(incoming.cloneNode(true));
      }
      nav.querySelectorAll('.cy-nav-links a').forEach(link=>{
        if (route(new URL(link.href).pathname)===current) link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
      document.dispatchEvent(new Event('blog:pagechange'));
      window.scrollTo({top:saved?.scroll || 0,behavior:'instant'});
      requestAnimationFrame(()=>{
        if (token!==revision) return;
        const pane = document.querySelector('.cy-directory-content');
        if (saved && pane) { pane.scrollTop=saved.left || 0; pane.dispatchEvent(new Event('scroll')); }
        const index = document.querySelector('.cy-tag-index');
        if (saved && index) index.scrollTop=saved.right || 0;
      });
      animations.forEach(animation=>animation.cancel()); animations=[];
      if (!reduced && main.animate) {
        const incoming = main.animate([{opacity:0,transform:`translateX(${direction * 45}px)`},{opacity:1,transform:'translateX(0)'}],{duration:220,easing:'ease-out'});
        animations.push(incoming);
      }
      main.setAttribute('tabindex','-1'); main.focus({preventScroll:true});
      status.hidden=true;
    } catch (error) {
      if (error.name==='AbortError' || token!==revision) return;
      console.error('Blog navigation failed',url.href,error);
      status.textContent='页面载入失败，请再次点击重试。';
      if (saved) location.reload();
    } finally { if(token===revision) nav.removeAttribute('aria-busy'); }
  };
  nav.addEventListener('click', event => {
    const link=event.target.closest('.cy-nav-links a');
    if (!link || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url=new URL(link.href);
    if (url.origin!==location.origin || !routes.includes(route(url.pathname))) return;
    event.preventDefault();
    if (route(url.pathname)===current) {
      revision++; controller?.abort(); animations.forEach(animation=>animation.cancel()); animations=[];
      status.hidden=true; nav.removeAttribute('aria-busy'); return;
    }
    navigate(url);
  });
  window.addEventListener('popstate', event=>{
    if (route(location.pathname)===current) return;
    if (!routes.includes(route(location.pathname))) {location.reload();return;}
    navigate(new URL(location.href), event.state || {});
  });
})();
