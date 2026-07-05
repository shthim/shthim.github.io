/**
 * 酒狐・Shukko — 个人主页交互脚本
 * 音乐播放器 · 画廊 · 导航交互
 */

'use strict';

// =============================================
// 1. 导航栏
// =============================================
(() => {
  const header = document.getElementById('header');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // 移动端菜单切换
  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('show');
  });

  // 点击导航链接后关闭菜单
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle?.classList.remove('active');
      menu?.classList.remove('show');
    });
  });

  // 滚动监听：header shadow + 高亮当前 section
  const sections = document.querySelectorAll('section[id]');

  const onScroll = () => {
    const scrollY = window.scrollY;

    // header shadow
    header?.classList.toggle('scrolled', scrollY > 60);

    // 活跃链接高亮
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // 初始调用
})();

// =============================================
// 2. 音乐播放器
// =============================================
(() => {
  const audio = new Audio();
  let playlist = [];
  let currentIndex = -1;
  let isPlaying = false;

  // DOM 元素
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const volumeBar = document.getElementById('volume-bar');
  const volumeFill = document.getElementById('volume-fill');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const coverArt = document.getElementById('cover-art');
  const playlistEl = document.getElementById('playlist');

  // ---------- 工具函数 ----------
  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ---------- 播放列表管理 ----------
  function loadPlaylist(tracks) {
    playlist = tracks;
    renderPlaylist();
    if (playlist.length > 0) {
      // 尝试恢复之前播放的曲目
      const saved = localStorage.getItem('shukko_last_track');
      const idx = saved ? playlist.findIndex(t => t.title === saved) : -1;
      loadTrack(idx >= 0 ? idx : 0);
    }
  }

  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = '';
    if (playlist.length === 0) {
      playlistEl.innerHTML = `
        <li class="playlist-item">
          <span class="pl-title">暂无曲目</span>
          <span class="pl-artist">请将 MP3 放在 music/ 目录下</span>
        </li>`;
      return;
    }
    playlist.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = 'playlist-item' + (idx === currentIndex ? ' active' : '');
      li.innerHTML = `
        <span class="pl-title">${track.title}</span>
        <span class="pl-artist">${track.artist || ''}</span>`;
      li.addEventListener('click', () => loadTrack(idx));
      playlistEl.appendChild(li);
    });
  }

  // ---------- 加载/切换曲目 ----------
  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[currentIndex];

    // 更新 UI
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist || '未知艺术家';
    localStorage.setItem('shukko_last_track', track.title);

    // 更新封面
    if (track.cover) {
      coverArt.innerHTML = `<img src="${track.cover}" alt="${track.title}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      coverArt.innerHTML = `<div class="cover-placeholder">🎵</div>`;
    }

    // 加载音频
    if (track.src) {
      audio.src = track.src;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => { isPlaying = false; updatePlayBtn(); });
      }
    } else {
      audio.src = '';
    }

    renderPlaylist();
    updatePlayBtn();
  }

  // ---------- 播放控制 ----------
  function togglePlay() {
    if (playlist.length === 0) return;
    if (!audio.src && currentIndex >= 0) {
      loadTrack(currentIndex);
    }
    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        updatePlayBtn();
      }).catch(err => {
        console.warn('播放失败:', err);
        isPlaying = false;
        updatePlayBtn();
      });
    } else {
      audio.pause();
      isPlaying = false;
      updatePlayBtn();
    }
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    const idx = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    loadTrack(idx);
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    const idx = (currentIndex + 1) % playlist.length;
    loadTrack(idx);
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }

  function updatePlayBtn() {
    if (!playBtn) return;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  // ---------- 进度条 ----------
  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = Math.min(pct, 100) + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalTimeEl.textContent = formatTime(audio.duration);
  }

  function seekProgress(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  }

  // ---------- 音量控制 ----------
  function setVolume(pct) {
    audio.volume = Math.max(0, Math.min(1, pct));
    volumeFill.style.width = (pct * 100) + '%';
    localStorage.setItem('shukko_volume', pct);
  }

  function seekVolume(e) {
    const rect = volumeBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  }

  // ---------- 事件绑定 ----------
  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', prevTrack);
  nextBtn?.addEventListener('click', nextTrack);

  // 进度条
  progressBar?.addEventListener('click', seekProgress);

  // 音量
  volumeBar?.addEventListener('click', seekVolume);

  // Audio 事件
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('play', () => { isPlaying = true; updatePlayBtn(); });
  audio.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });

  // ---------- 初始化 ----------
  // 恢复音量
  const savedVol = localStorage.getItem('shukko_volume');
  if (savedVol !== null) setVolume(parseFloat(savedVol));
  else setVolume(0.7);

  // 暴露接口供外部设置播放列表
  window.ShukkoPlayer = { loadPlaylist, loadTrack, play: togglePlay };

  // 从 data 属性加载播放列表（由 script.js 下方配置）
  console.log('🎵 狐音小馆已就绪 — 在 script.js 中配置播放列表');
})();

// =============================================
// 3. 画廊
// =============================================
(() => {
  const galleryGrid = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  // ---------- 配置：在这里添加你的图片 ----------
  const galleryImages = [];

  // ---------- 渲染画廊 ----------
  function renderGallery(images) {
    if (!galleryGrid) return;
    if (images.length === 0) {
      // 已经默认有占位卡片了
      return;
    }
    // 清除占位，渲染真实图片
    galleryGrid.innerHTML = '';
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${img.src}" alt="${img.alt || ''}" loading="lazy">`;
      item.addEventListener('click', () => openLightbox(img.src));
      galleryGrid.appendChild(item);
    });
  }

  // ---------- Lightbox ----------
  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ---------- 暴露接口 ----------
  window.ShukkoGallery = { renderGallery, images: galleryImages };
})();

// =============================================
// 4. 淡入动画 (IntersectionObserver)
// =============================================
(() => {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  // 观察卡片元素
  document.querySelectorAll('.project-card, .gallery-item, .music-player, .section-header').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
})();

// =============================================
// 5. 播放列表配置
// 将你的 MP3 文件放在 music/ 目录下，然后在此配置
// =============================================
(() => {
  const tracks = [
    // 示例格式 — 取消注释即可使用：
    // { title: '曲名', artist: '艺术家', src: 'music/your-song.mp3', cover: 'assets/images/cover.jpg' },
  ];

  if (tracks.length > 0 && window.ShukkoPlayer) {
    window.ShukkoPlayer.loadPlaylist(tracks);
  }
})();

// =============================================
// 6. 画廊配置
// 将你的图片放在 assets/images/ 目录下，然后在此配置
// =============================================
(() => {
  const images = [
    // 示例格式 — 取消注释即可使用：
    // { src: 'assets/images/photo1.jpg', alt: '描述' },
    // { src: 'assets/images/photo2.jpg', alt: '描述' },
  ];

  if (images.length > 0 && window.ShukkoGallery) {
    window.ShukkoGallery.renderGallery(images);
  }
})();

console.log('🦊 酒狐小窝已加载完成');
