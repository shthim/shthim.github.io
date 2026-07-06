/**
 * 酒狐・Shukko — 个人主页（极简 SPA 版）
 * 半圆旋转导航 · 淡入淡出切页 · 音乐播放器 · 画廊
 */

'use strict';

// =============================================
// 1. 导航 + 淡入淡出切页
// =============================================
(() => {
  const pages = document.querySelectorAll('.page');
  const navBtns = document.querySelectorAll('.nav-btn');
  const sideNav = document.getElementById('sideNav');
  const navToggle = document.getElementById('navToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const dots = document.querySelectorAll('.dot');
  const totalPages = pages.length;

  let currentPage = 0;
  let isAnimating = false;

  // ---------- 切换到指定页（淡入淡出） ----------
  function goToPage(index) {
    if (isAnimating) return;
    if (index < 0) index = 0;
    if (index >= totalPages) index = totalPages - 1;
    if (index === currentPage) return;

    isAnimating = true;

    // 淡出当前页
    const oldPage = pages[currentPage];
    oldPage.classList.remove('active');

    // 切换到新页
    currentPage = index;
    const newPage = pages[currentPage];
    // 用 requestAnimationFrame 确保浏览器渲染了旧页的 opacity:0 再显示新页
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newPage.classList.add('active');
        isAnimating = false;
      });
    });

    // 更新导航按钮状态
    navBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === currentPage);
    });

    // 更新圆点指示器
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
    });

    // 切换菜单图标：导航展开时显示 ✕，收起时显示 ☰
    // 但切页时不自动收回导航
  }

  // ---------- Nav 按钮点击 ----------
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      const target = document.getElementById(`page-${page}`);
      if (target) {
        const index = parseInt(target.dataset.index);
        goToPage(index);
      }
    });
  });

  // ---------- Nav 切换按钮 ----------
  navToggle.addEventListener('click', () => {
    const isOpen = sideNav.classList.toggle('open');
    toggleIcon.textContent = isOpen ? '✕' : '☰';
  });

  // 点击导航外部或页面内容时关闭
  document.addEventListener('click', (e) => {
    if (!sideNav.contains(e.target) && sideNav.classList.contains('open')) {
      sideNav.classList.remove('open');
      toggleIcon.textContent = '☰';
    }
  });

  // ---------- 圆点指示器点击 ----------
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index);
      goToPage(index);
    });
  });

  // ---------- 键盘导航 ----------
  document.addEventListener('keydown', (e) => {
    // 如果 lightbox 开着，不处理翻页
    if (document.getElementById('lightbox')?.classList.contains('show')) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goToPage(currentPage - 1);
    }

    // Escape 关闭导航
    if (e.key === 'Escape' && sideNav.classList.contains('open')) {
      sideNav.classList.remove('open');
      toggleIcon.textContent = '☰';
    }
  });

  // ---------- 初始化 ----------
  // 确保首页是唯一激活的
  pages.forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
  navBtns[0]?.classList.add('active');

  // 暴露接口
  window.ShukkoNavigator = { goToPage, getCurrentPage: () => currentPage };

  console.log('🦊 酒狐小屋 — 导航已启动');
})();

// =============================================
// 2. 音乐播放器
// =============================================
(() => {
  const audio = new Audio();
  let playlist = [];
  let currentIndex = -1;
  let isPlaying = false;

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

  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function loadPlaylist(tracks) {
    playlist = tracks;
    renderPlaylist();
    if (playlist.length > 0) {
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

  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[currentIndex];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist || '未知艺术家';
    localStorage.setItem('shukko_last_track', track.title);

    if (track.cover) {
      coverArt.innerHTML = `<img src="${track.cover}" alt="${track.title}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      coverArt.innerHTML = `<div class="cover-placeholder">🎵</div>`;
    }

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

  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', prevTrack);
  nextBtn?.addEventListener('click', nextTrack);
  progressBar?.addEventListener('click', seekProgress);
  volumeBar?.addEventListener('click', seekVolume);

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('play', () => { isPlaying = true; updatePlayBtn(); });
  audio.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });

  const savedVol = localStorage.getItem('shukko_volume');
  if (savedVol !== null) setVolume(parseFloat(savedVol));
  else setVolume(0.7);

  window.ShukkoPlayer = { loadPlaylist, loadTrack, play: togglePlay };

  console.log('🎵 狐音小馆已就绪');
})();

// =============================================
// 3. 画廊
// =============================================
(() => {
  const galleryGrid = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  const galleryImages = [];

  function renderGallery(images) {
    if (!galleryGrid) return;
    if (images.length === 0) return;
    galleryGrid.innerHTML = '';
    images.forEach((img) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${img.src}" alt="${img.alt || ''}" loading="lazy">`;
      item.addEventListener('click', () => openLightbox(img.src));
      galleryGrid.appendChild(item);
    });
  }

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

  window.ShukkoGallery = { renderGallery, images: galleryImages };
})();

// =============================================
// 4. 播放列表配置
// =============================================
(() => {
  const tracks = [
    // { title: '曲名', artist: '艺术家', src: 'music/your-song.mp3', cover: 'assets/images/cover.jpg' },
  ];

  if (tracks.length > 0 && window.ShukkoPlayer) {
    window.ShukkoPlayer.loadPlaylist(tracks);
  }
})();

// =============================================
// 5. 画廊配置
// =============================================
(() => {
  const images = [
    // { src: 'assets/images/photo1.jpg', alt: '描述' },
  ];

  if (images.length > 0 && window.ShukkoGallery) {
    window.ShukkoGallery.renderGallery(images);
  }
})();

console.log('🦊 酒狐小窝 — 全部就绪');
