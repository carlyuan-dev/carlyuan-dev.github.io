(function () {
  const isHome = location.pathname === '/' || location.pathname === '/index.html';
  const heroWallpapers = [
    '/img/personal/hero-wallpaper/2026.1.2 黄山.jfif',
    '/img/personal/hero-wallpaper/2026.3.22 上海共青森林公园.jfif',
    '/img/personal/hero-wallpaper/2026.5.4 盐城丹顶鹤湿地.jfif'
  ];

  if (isHome) {
    const dayIndex = Math.floor(Date.now() / 86400000) % heroWallpapers.length;
    document.documentElement.style.setProperty(
      '--cy-hero-photo',
      `url("${encodeURI(heroWallpapers[dayIndex])}")`
    );
  }

  const addListeningCard = () => {
    if (document.querySelector('.cy-listening-card')) return;

    const aside = document.querySelector('#aside-content');
    if (!aside) return;

    const announcement = aside.querySelector('.card-announcement');
    const card = document.createElement('div');
    card.className = 'card-widget cy-listening-card';
    card.innerHTML = `
      <div class="item-headline">
        <i class="fas fa-music"></i>
        <span>最近在听</span>
      </div>
      <div class="cy-song">
        <div class="cy-song-mark">♪</div>
        <div>
          <div class="cy-song-title">过去来的人</div>
          <div class="cy-song-artist">刘森</div>
        </div>
      </div>
    `;

    if (announcement) {
      announcement.insertAdjacentElement('afterend', card);
    } else {
      aside.insertBefore(card, aside.firstChild);
    }
  };

  addListeningCard();

  if (!isHome || document.querySelector('.cy-home-panel')) return;

  const recentPosts = document.querySelector('#recent-posts');
  if (!recentPosts) return;

  const panel = document.createElement('section');
  panel.className = 'cy-home-panel';
  panel.innerHTML = `
    <p class="cy-home-eyebrow">最近</p>
    <h2 class="cy-home-title">最近先把做过的东西重新讲清楚</h2>
    <p class="cy-home-desc">这里会放学习记录、项目复盘和实验笔记。内容尽量围绕具体问题写：一段链路怎么跑通，一个 badcase 怎么定位，一次模型实验留下了什么边界。</p>
    <div class="cy-home-grid">
      <div class="cy-home-card">
        <h3>最近在做</h3>
        <ul>
          <li>整理 DeepTutor-HKDSE 的 Agent/RAG 链路</li>
          <li>拆 ChartMind-VL 的评估和 badcase 流程</li>
          <li>补 PEFT、QLoRA 和模型评估笔记</li>
        </ul>
      </div>
      <div class="cy-home-card">
        <h3>常写的方向</h3>
        <p>Agent、RAG、多模态问答、本地模型适配、微调实验，以及一些工程里真实遇到的小问题。</p>
      </div>
      <div class="cy-home-card">
        <h3>留给自己的提醒</h3>
        <p>能复现、能解释、能指出边界，才算真的读懂。博客先服务这个目标。</p>
      </div>
    </div>
    <div class="cy-home-links">
      <a href="/notes/">学习记录</a>
      <a href="/projects/">项目实践</a>
      <a href="/experiments/">实验笔记</a>
      <a href="/about/">关于</a>
    </div>
  `;

  recentPosts.insertBefore(panel, recentPosts.firstChild);
})();
