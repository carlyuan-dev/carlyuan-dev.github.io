(function () {
  const isHome = location.pathname === '/' || location.pathname === '/index.html' || /^\/page\/\d+\/?$/.test(location.pathname);
  const heroWallpapers = [
    '/img/personal/hero-wallpaper/2026.1.2 黄山.webp',
    '/img/personal/hero-wallpaper/2026.3.22 上海共青森林公园.webp',
    '/img/personal/hero-wallpaper/2026.5.4 盐城丹顶鹤湿地.webp'
  ];

  {
    const dayIndex = Math.floor(Date.now() / 86400000) % heroWallpapers.length;
    document.documentElement.style.setProperty(
      '--cy-hero-photo',
      `url("${encodeURI(heroWallpapers[dayIndex])}")`
    );
  }

})();
