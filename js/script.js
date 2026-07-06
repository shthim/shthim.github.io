/**
 * 酒狐・Shukko — width 展开半圆导航 + 淡入淡出切页
 */
'use strict';

// ===== 1. 导航 =====
(() => {
  const toggle = document.getElementById('toggleBtn');
  const panel = document.getElementById('navPanel');
  const icon = document.getElementById('toggleIcon');
  const pages = document.querySelectorAll('.page');
  const btns = document.querySelectorAll('.nav-btn');
  const dots = document.querySelectorAll('.dot');
  const total = pages.length;
  let cur = 0, busy = false;

  function go(i) {
    if (busy || i === cur) return;
    if (i < 0) i = 0; if (i >= total) i = total - 1;
    busy = true;
    pages[cur].classList.remove('active');
    cur = i;
    pages[cur].classList.add('active');
    btns.forEach((b, idx) => b.classList.toggle('active', idx === cur));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === cur));
    setTimeout(() => busy = false, 500);
  }

  btns.forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById('page-' + b.dataset.page);
    if (t) go(parseInt(t.dataset.index));
  }));

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = panel.classList.toggle('open');
    toggle.classList.toggle('open', open);
    icon.textContent = open ? '✕' : '☰';
  });

  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggle) {
      panel.classList.remove('open');
      toggle.classList.remove('open');
      icon.textContent = '☰';
    }
  });

  dots.forEach(d => d.addEventListener('click', () => go(parseInt(d.dataset.i))));

  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('show')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(cur - 1); }
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
      toggle.classList.remove('open');
      icon.textContent = '☰';
    }
  });

  pages.forEach((p, i) => p.classList.toggle('active', i === 0));
  btns[0]?.classList.add('active');
  window.ShukkoNav = { go, cur: () => cur };
  console.log('🦊 导航启动');
})();

// ===== 2. 播放器 =====
(() => {
  const audio = new Audio();
  let pl = [], idx = -1, playing = false;
  const $ = id => document.getElementById(id);
  const playBtn = $('playBtn'), prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
  const progBar = $('progBar'), progFill = $('progFill');
  const volBar = $('volBar'), volFill = $('volFill');
  const curT = $('curTime'), totT = $('totTime');
  const tName = $('trackName'), tArtist = $('trackArtist');
  const cover = $('coverArt'), plist = $('plist');

  function fmt(s) { if (isNaN(s)||!isFinite(s)) return '0:00'; const m=Math.floor(s/60); return m+':'+String(Math.floor(s%60)).padStart(2,'0'); }

  function load(tracks) {
    pl = tracks; render();
    if (pl.length) {
      const saved = localStorage.getItem('shukko_track');
      const i = saved ? pl.findIndex(t => t.title === saved) : -1;
      loadTrack(i >= 0 ? i : 0);
    }
  }

  function render() {
    if (!plist) return;
    plist.innerHTML = '';
    if (!pl.length) { plist.innerHTML = '<li class="plist-item"><span class="pl-title">暂无曲目</span><span class="pl-artist">请添加音乐文件</span></li>'; return; }
    pl.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'plist-item' + (i === idx ? ' active' : '');
      li.innerHTML = `<span class="pl-title">${t.title}</span><span class="pl-artist">${t.artist||''}</span>`;
      li.addEventListener('click', () => loadTrack(i));
      plist.appendChild(li);
    });
  }

  function loadTrack(i) {
    if (i < 0 || i >= pl.length) return;
    idx = i; const t = pl[idx];
    tName.textContent = t.title; tArtist.textContent = t.artist || '未知艺术家';
    localStorage.setItem('shukko_track', t.title);
    cover.innerHTML = t.cover ? `<img src="${t.cover}" alt="${t.title}" style="width:100%;height:100%;object-fit:cover">` : '<span class="cover-pl">🎵</span>';
    if (t.src) { audio.src = t.src; audio.load(); if (playing) audio.play().catch(()=>{playing=false;upd();}); }
    else audio.src = '';
    render(); upd();
  }

  function togglePlay() {
    if (!pl.length) return;
    if (!audio.src && idx >= 0) loadTrack(idx);
    if (audio.paused) audio.play().then(()=>{playing=true;upd();}).catch(()=>{playing=false;upd();});
    else { audio.pause(); playing=false; upd(); }
  }

  function prev() { if (!pl.length) return; const i = idx > 0 ? idx-1 : pl.length-1; loadTrack(i); if (playing) audio.play().catch(()=>{}); }
  function next() { if (!pl.length) return; const i = (idx+1)%pl.length; loadTrack(i); if (playing) audio.play().catch(()=>{}); }
  function upd() { if (playBtn) playBtn.textContent = playing ? '⏸' : '▶'; }
  function onTime() { if (!audio.duration) return; progFill.style.width = Math.min((audio.currentTime/audio.duration)*100,100)+'%'; curT.textContent = fmt(audio.currentTime); totT.textContent = fmt(audio.duration); }
  function seekProg(e) { const r=progBar.getBoundingClientRect(); audio.currentTime = Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*audio.duration; }
  function setVol(p) { audio.volume = Math.max(0,Math.min(1,p)); volFill.style.width = (p*100)+'%'; localStorage.setItem('shukko_vol',p); }
  function seekVol(e) { const r=volBar.getBoundingClientRect(); setVol(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))); }

  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);
  progBar?.addEventListener('click', seekProg);
  volBar?.addEventListener('click', seekVol);
  audio.addEventListener('timeupdate', onTime);
  audio.addEventListener('loadedmetadata', ()=>{ totT.textContent = fmt(audio.duration); });
  audio.addEventListener('ended', next);
  audio.addEventListener('play', ()=>{playing=true;upd();});
  audio.addEventListener('pause', ()=>{playing=false;upd();});
  const sv = localStorage.getItem('shukko_vol'); setVol(sv !== null ? parseFloat(sv) : 0.7);
  window.ShukkoPlayer = { load, loadTrack, play: togglePlay };
  console.log('🎵 播放器就绪');
})();

// ===== 3. 画廊 =====
(() => {
  const grid = document.getElementById('galGrid');
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');

  function render(imgs) {
    if (!grid || !imgs.length) return;
    grid.innerHTML = '';
    imgs.forEach(img => {
      const d = document.createElement('div'); d.className = 'gal-item';
      d.innerHTML = `<img src="${img.src}" alt="${img.alt||''}" loading="lazy">`;
      d.addEventListener('click', () => open(img.src));
      grid.appendChild(d);
    });
  }
  function open(src) { if (!lb||!lbImg) return; lbImg.src=src; lb.classList.add('show'); document.body.style.overflow='hidden'; }
  function close() { lb.classList.remove('show'); document.body.style.overflow=''; }
  lbClose?.addEventListener('click', close);
  lb?.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.ShukkoGal = { render };
})();

// ===== 4. 配置 =====
(() => {
  const tracks = [];
  if (tracks.length && window.ShukkoPlayer) window.ShukkoPlayer.load(tracks);
  const images = [];
  if (images.length && window.ShukkoGal) window.ShukkoGal.render(images);
})();
console.log('🦊 全部就绪');
