# 🦊 酒狐・Shukko — 个人主页

酒狐（しゅっこ/Shukko）风格的个人网页，部署于 GitHub Pages。

## 功能

- 🎵 **狐音小馆** — HTML5 音乐播放器（支持播放列表、进度控制）
- 🖼️ **狐影集** — 图片画廊（Lightbox 点击放大）
- 📦 **狐作项目** — MC Bedrock 插件作品展示与下载
- 🎨 **酒狐风 UI** — 红白暖色调 × 和风设计，响应式

## 使用

### 添加音乐
1. 将 MP3 文件放入 `music/` 目录
2. 在 `js/script.js` 的「播放列表配置」部分添加曲目：
```js
{ title: '曲名', artist: '艺术家', src: 'music/your-song.mp3' }
```

### 添加图片
1. 将图片放入 `assets/images/` 目录
2. 在 `js/script.js` 的「画廊配置」部分添加：
```js
{ src: 'assets/images/photo.jpg', alt: '描述' }
```

### 自定义头像
替换 Hero 区的 `avatar-placeholder` 为 `<img src="assets/images/avatar.jpg">`

## 技术栈

纯前端 · HTML + CSS + JavaScript · GitHub Pages · 无依赖框架

## 许可

MIT
