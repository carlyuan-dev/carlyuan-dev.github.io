# 博客源项目

从 Windows 项目迁移，使用 Hexo 7.3.0、Butterfly 5.3.5。依赖版本以 `package-lock.json` 为准。

## 本地开发

在仓库根目录执行：

```sh
cd hexo-source
npm ci
npm run build
npm run server -- --ip 127.0.0.1 --port 4000
```

打开 http://127.0.0.1:4000/，在终端按 Ctrl+C 停止服务。依赖没有变化时，不必每次重新安装。

2026-10-02 在 macOS、Node.js 24.18.0 下完成安装、构建和预览验证。系统有两份 npm：用户路径的 12.0.2 和 Homebrew 的 11.16.0；成功安装日志记录的是 11.16.0。未修改全局环境或项目依赖。

## 文件位置

- `source/_posts/`：文章 Markdown。
- `source/` 下其他目录：页面、图片和定制 CSS/JS。
- `_config.yml`：网站配置；`_config.butterfly.yml`：主题配置。
- 当前加载本地 `themes/butterfly/`（迁移包中的 Butterfly 5.3.5），导航和目录模板在此维护。不要修改 node_modules 中的主题。
- `doc/`：内部计划和历程，保持 Git 忽略，需要在电脑之间另行备份或拷贝。
- `public/`、`node_modules/`、`db.json`、`.deploy_git/`：生成内容或缓存，保持 Git 忽略。

仓库根目录仍保留原发布页面。本目录构建输出到自己的 `public/`，不会自动更新根目录页面。

## 发布方式

源码位于 `hexo-source/`，根目录为生成后的静态站点；两者一起提交到 `main`。每次修改前先 `git pull --ff-only`，在本目录构建后把 `public/` 同步至仓库根目录，只删除旧的生成文件，保留 `hexo-source/` 与 `.git/`。

不要直接执行 `npm run deploy`：原有 hexo-deployer-git 配置会强制更新发布分支，无法保留同分支源码。部署配置保持原样，本项目使用普通 Git 提交与推送更新根目录。

`doc/` 为本机内部记录和草稿，不进入 Git。字体文件放在 `source/fonts/`，与站点一起同步；依赖与缓存不入库。

## 文章标签规范

每篇文章只设置一个主题标签，避免按项目名和细节堆叠标签。例如检索相关内容使用 `Rag`。
