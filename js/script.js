/**
 * 酒狐・Shukko — 个人主页
 * 半圆弹鼓导航 · 淡入淡出切页
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

  function goToPage(index) {
    if (isAnimating) return;
    if (index < 0) index = 0;
    if (index >= totalPages) index = totalPages - 1;
    if (index === currentPage) return;

    isAnimating = true;

    // 切换页面
    pages[currentPage].classList.remove('active');
    currentPage = index;
    pages[currentPage].classList.add('active');

    // 更新导航按钮
    navBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === currentPage);
    });

    // 更新圆点
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
    });

    // 动画锁
    setTimeout(() => { isAnimating = false; }, 500);
  }

  // Nav 按钮点击
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`page-${btn.dataset.page}`);
      if (target) goToPage(parseInt(target.dataset.index));
    });
  });

  // 切换按钮（独立 fixed，始终在最左边）
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = sideNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    toggleIcon.textContent = isOpen ? '✕' : '☰';
  });

  // 点击页面关闭导航
  document.addEventListener('click', (e) => {
    if (sideNav.classList.contains('open') &&
        !sideNav.contains(e.target) &&
        e.target !== navToggle) {
      sideNav.classList.remove('open');
      navToggle.classList.remove('open');
      toggleIcon.textContent = '☰';
    }
  });

  // 圆点点击
  dots.forEach((dot) => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.index)));
  });

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox')?.classList.contains('show')) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goToPage(currentPage - 1);
    }

    if (e.key === 'Escape' && sideNav.classList.contains('open')) {
      sideNav.classList.remove('open');
      navToggle.classList.remove('open');
      toggleIcon.textContent = '☰';
    }
  });

  // 初始化
  pages.forEach((p, i) => p.classList.toggle('active', i === 0));
  navBtns[0]?.classList.add('active');

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

  const $ = id => document.getElementById(id);
  const playBtn = $('play-btn');
  const prevBtn = $('prev-btn');
  const nextBtn = $('next-btn');
  const progressBar = $('progress-bar');
  const progressFill = $('progress-fill');
  const volumeBar = $('volume-bar');
  const volumeFill = $('volume-fill');
  const currentTimeEl = $('current-time');
  const totalTimeEl = $('total-time');
  const trackTitle = $('track-title');
  const trackArtist = $('track-artist');
  const coverArt = $('cover-art');
  const playlistEl = $('playlist');

  function fmt(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function loadPlaylist(tracks) {
    playlist = tracks;
    renderPl();
    if (playlist.length > 0) {
      const saved = localStorage.getItem('shukko_last_track');
      const idx = saved ? playlist.findIndex(t => t.title === saved) : -1;
      loadTrack(idx >= 0 ? idx : 0);
    }
  }

  function renderPl() {
    if (!playlistEl) return;
    playlistEl.innerHTML = '';
    if (playlist.length === 0) {
      playlistEl.innerHTML = `<li class="playlist-item"><span class="pl-title">暂无曲目</span><span class="pl-artist">请将 MP3 放在 music/ 目录下</span></li>`;
      return;
    }
    playlist.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = 'playlist-item' + (idx === currentIndex ? ' active' : '');
      li.innerHTML = `<span class="pl-title">${track.title}</span><span class="pl-artist">${track.artist || ''}</span>`;
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
    coverArt.innerHTML = track.cover
      ? `<img src="${track.cover}" alt="${track.title}" style="width:100%;height:100%;object-fit:cover;">`
      : `<div class="cover-placeholder">🎵</div>`;
    if (track.src) {
      audio.src = track.src;
      audio.load();
      if (isPlaying) audio.play().catch(() => { isPlaying = false; updateBtn(); });
    } else {
      audio.src = '';
    }
    renderPl();
    updateBtn();
  }

  function togglePlay() {
    if (playlist.length === 0) return;
    if (!audio.src && currentIndex >= 0) loadTrack(currentIndex);
    if (audio.paused) {
      audio.play().then(() => { isPlaying = true; updateBtn(); })
        .catch(err => { console.warn('播放失败:', err); isPlaying = false; updateBtn(); });
    } else {
      audio.pause(); isPlaying = false; updateBtn();
    }
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    const idx = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    loadTrack(idx);
    if (isPlaying) audio.play().catch(() => {});
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    const idx = (currentIndex + 1) % playlist.length;
    loadTrack(idx);
    if (isPlaying) audio.play().catch(() => {});
  }

  function updateBtn() { if (playBtn) playBtn.textContent = isPlaying ? '⏸' : '▶'; }

  function updateProgress() {
    if (!audio.duration) return;
    progressFill.style.width = Math.min((audio.currentTime / audio.duration) * 100, 100) + '%';
    currentTimeEl.textContent = fmt(audio.currentTime);
    totalTimeEl.textContent = fmt(audio.duration);
  }

  function seekProgress(e) {
    const r = progressBar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
  }

  function setVolume(pct) {
    audio.volume = Math.max(0, Math.min(1, pct));
    volumeFill.style.width = (pct * 100) + '%';
    localStorage.setItem('shukko_volume', pct);
  }

  function seekVolume(e) {
    const r = volumeBar.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  }

  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', prevTrack);
  nextBtn?.addEventListener('click', nextTrack);
  progressBar?.addEventListener('click', seekProgress);
  volumeBar?.addEventListener('click', seekVolume);
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = fmt(audio.duration); });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('play', () => { isPlaying = true; updateBtn(); });
  audio.addEventListener('pause', () => { isPlaying = false; updateBtn(); });

  const savedVol = localStorage.getItem('shukko_volume');
  setVolume(savedVol !== null ? parseFloat(savedVol) : 0.7);

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

  function renderGallery(images) {
    if (!galleryGrid || images.length === 0) return;
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
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  window.ShukkoGallery = { renderGallery };
})();

// =============================================
// 4. 配置区
// =============================================
(() => {
  // 播放列表 — 取消注释即可使用
  const tracks = [];
  if (tracks.length > 0 && window.ShukkoPlayer) window.ShukkoPlayer.loadPlaylist(tracks);

  // 画廊 — 取消注释即可使用
  const images = [];
  if (images.length > 0 && window.ShukkoGallery) window.ShukkoGallery.renderGallery(images);
})();

console.log('🦊 酒狐小窝 — 全部就绪');
