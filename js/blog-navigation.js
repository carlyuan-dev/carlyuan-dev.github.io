(() => {
  const initDirectory = () => {
  const directory = document.querySelector('.cy-directory');
  if (directory?.dataset.initialized) return;
  if (directory) directory.dataset.initialized = 'true';
  if (directory) {
    const content = directory.querySelector('.cy-directory-content');
    const groups = [...directory.querySelectorAll('.cy-post-group')];
    const links = [...directory.querySelectorAll('.cy-tag-index a')];
    const activate = id => links.forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const track = () => {
      const top = content.getBoundingClientRect().top;
      let current = groups[0];
      for (const group of groups) {
        if (group.getBoundingClientRect().top <= top + 50) current = group;
      }
      if (current) activate(current.querySelector('h2').id);
    };
    const jump = id => {
      const heading = groups.map(group => group.querySelector('h2')).find(heading => heading.id === id);
      if (!heading) return;
      const top = heading.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
      content.scrollTo({top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      activate(id);
    };
    links.forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(history.state, '', link.hash);
      jump(link.hash.slice(1));
    }));
    content.addEventListener('scroll', track, {passive:true});
    const requested = new URLSearchParams(location.search).get(directory.dataset.kind === 'tags' ? 'tag' : 'month') || JSON.parse(directory.dataset.selected || '[]')[0];
    const group = groups.find(group => group.dataset.group === requested);
    requestAnimationFrame(() => {
      const id = location.hash.slice(1) || (group && group.querySelector('h2').id);
      if (id) jump(id); else track();
    });
  }
  };
  initDirectory();
  document.addEventListener('blog:pagechange', initDirectory);
  const opener = document.querySelector('.cy-search-open');
  if (!opener) return;
  const nav = document.querySelector('#nav');
  const form = document.querySelector('#cy-search-form');
  const input = document.querySelector('#cy-search-input');
  const panel = document.querySelector('#cy-search-panel');
  const status = document.querySelector('#cy-search-status');
  const results = document.querySelector('#cy-search-results');
  const retry = document.querySelector('#cy-search-retry');
  let posts, loading, composing = false;
  const render = () => {
    results.replaceChildren();
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) { status.textContent = '输入标题、标签或正文中的关键词。'; return; }
    if (!posts) return;
    const words = query.split(/\s+/);
    const matches = posts.filter(post => words.every(word => `${post.title} ${post.tags.join(' ')} ${post.text}`.toLocaleLowerCase().includes(word)));
    status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '没有找到相关文章。';
    matches.forEach(post => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.textContent = post.title;
      link.href = post.url.startsWith('/') && !post.url.startsWith('//') ? post.url : '/';
      const snippet = document.createElement('p');
      const start = Math.max(0, post.text.toLocaleLowerCase().indexOf(words[0]) - 32);
      snippet.textContent = (start ? '…' : '') + post.text.slice(start, start + 160);
      item.append(link, snippet); results.append(item);
    });
  };
  const load = async () => {
    if (posts) { render(); return; }
    if (loading) return loading;
    retry.hidden = true; status.textContent = '正在载入文章索引…';
    loading = (async () => {
      try {
        const response = await fetch(panel.dataset.index);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid search index');
        posts = data; render();
      } catch (error) {
        status.textContent = '文章索引载入失败，请重试。'; retry.hidden = false;
        console.error('Blog search index failed:', panel.dataset.index, error);
      } finally { loading = null; }
    })();
    return loading;
  };
  const close = () => {
    form.hidden = panel.hidden = true; nav.classList.remove('cy-searching');
    opener.setAttribute('aria-expanded', 'false'); opener.focus({preventScroll: true});
  };
  opener.addEventListener('click', () => {
    form.hidden = panel.hidden = false; nav.classList.add('cy-searching');
    opener.setAttribute('aria-expanded', 'true'); input.focus({preventScroll: true}); load();
  });
  document.querySelector('#cy-search-close').addEventListener('click', close);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !form.hidden) close(); });
  form.addEventListener('submit', event => { event.preventDefault(); });
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; render(); });
  input.addEventListener('input', () => { if (!composing) render(); });
  retry.addEventListener('click', load);
})();
