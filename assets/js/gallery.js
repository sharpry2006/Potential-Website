/* ==========================================================================
   POTENTIAL — 影像系统
   1) 首页 Hero 摄影轮播   2) 首页照片墙   3) 画廊页（相册封面 + 瀑布流）
   4) 灯箱（缩略图条 / 计数 / 键盘 / 滑动）
   ========================================================================== */
(function () {
  'use strict';

  var DATA_URL = 'assets/data/gallery.json';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }

  function loadData() {
    return fetch(DATA_URL, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function visibleItems(items) {
    return (items || []).filter(function (i) { return i.visible !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* ============================================================ 灯箱 */
  var lb = null;
  var lbItems = [];
  var lbIndex = 0;

  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '图片查看');
    lb.innerHTML = ''
      + '<div class="lightbox__top">'
      + '  <span class="lightbox__count"><b data-lb-i>01</b> / <span data-lb-n>03</span></span>'
      + '  <div class="lightbox__tools">'
      + '    <a data-lb-dl href="#" download title="下载原图" aria-label="下载原图">↓</a>'
      + '    <button class="lightbox__close" type="button" aria-label="关闭">✕</button>'
      + '  </div>'
      + '</div>'
      + '<div class="lightbox__stage">'
      + '  <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="上一张">‹</button>'
      + '  <figure class="lightbox__fig"><img alt="" /><figcaption></figcaption></figure>'
      + '  <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="下一张">›</button>'
      + '</div>'
      + '<div class="lightbox__strip" data-lb-strip></div>';
    document.body.appendChild(lb);

    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('.lightbox__close')) { closeLightbox(); return; }
      if (e.target.closest('.lightbox__nav--prev')) { step(-1); return; }
      if (e.target.closest('.lightbox__nav--next')) { step(1); return; }
      var thumb = e.target.closest('[data-lb-strip] button');
      if (thumb) { lbIndex = Number(thumb.dataset.i); paint(); }
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Home') { lbIndex = 0; paint(); }
      else if (e.key === 'End') { lbIndex = lbItems.length - 1; paint(); }
    });

    var startX = null;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 46) step(dx < 0 ? 1 : -1);
      startX = null;
    });
    return lb;
  }

  function paint() {
    var item = lbItems[lbIndex] || {};
    var img = lb.querySelector('.lightbox__fig img');
    var apply = function () {
      img.src = item.file;
      img.alt = item.caption || '战队影像';
      img.style.opacity = '1';
    };
    img.style.opacity = '0';
    var pre = new Image();
    pre.onload = apply;
    pre.src = item.file;
    if (pre.complete) apply();

    var cap = lb.querySelector('figcaption');
    cap.textContent = item.caption || '';
    cap.hidden = !item.caption;
    lb.querySelector('[data-lb-i]').textContent = pad(lbIndex + 1);
    lb.querySelector('[data-lb-n]').textContent = pad(lbItems.length);

    var dl = lb.querySelector('[data-lb-dl]');
    dl.href = item.file;
    var ext = (item.file || '').match(/\.[a-z]+$/i);
    dl.setAttribute('download', (item.caption || 'potential') + (ext ? ext[0] : ''));
    lb.classList.toggle('is-single', lbItems.length < 2);

    var strip = lb.querySelector('[data-lb-strip]');
    if (strip.children.length !== lbItems.length) {
      strip.innerHTML = lbItems.map(function (it, i) {
        return '<button type="button" data-i="' + i + '" aria-label="第 ' + (i + 1) + ' 张"'
          + ' style="background-image:url(' + esc(it.thumb || it.file) + ')"></button>';
      }).join('');
    }
    Array.prototype.forEach.call(strip.children, function (b, i) {
      b.classList.toggle('is-active', i === lbIndex);
    });
    var active = strip.children[lbIndex];
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
    [lbIndex - 1, lbIndex + 1].forEach(function (i) {
      var it = lbItems[(i + lbItems.length) % lbItems.length];
      if (it) { var p = new Image(); p.src = it.file; }
    });
  }

  function step(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    paint();
  }

  function openLightbox(items, index) {
    ensureLightbox();
    lbItems = items;
    lbIndex = index;
    paint();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function bindOpen(host, getItems) {
    host.addEventListener('click', function (e) {
      var el = e.target.closest('[data-full]');
      if (!el) return;
      var items = getItems();
      var idx = items.findIndex(function (i) { return i.file === el.dataset.full; });
      openLightbox(items, idx < 0 ? 0 : idx);
    });
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var el = e.target.closest('[data-full]');
      if (!el) return;
      e.preventDefault();
      var items = getItems();
      var idx = items.findIndex(function (i) { return i.file === el.dataset.full; });
      openLightbox(items, idx < 0 ? 0 : idx);
    });
  }

  /* ============================================================ Hero 轮播 */
  function initHero() {
    var hero = document.getElementById('hero');
    var slidesEl = document.getElementById('heroSlides');
    if (!hero || !slidesEl) return;

    var metaEl = document.getElementById('heroMeta');
    var idxEl = document.getElementById('heroIdx');
    var totalEl = document.getElementById('heroTotal');
    var capEl = document.getElementById('heroCaption');
    var thumbsEl = document.getElementById('heroThumbs');

    var slides = [], current = 0, timer = null;

    // HTML 默认已带 hero--media（避免挂载时整体重排引起 CLS）；没有照片或数据失败时回退到蓝图版式
    var fallback = function () { hero.classList.remove('hero--media'); };
    loadData().then(function (data) {
      if (!data) return fallback();
      var list = visibleItems(data.images);
      // 首页轮播：优先按后台设置的「轮播顺序」，未设置的按最新排序
      var byNewest = function (a, b) { return (b.order || 0) - (a.order || 0); };
      var byRank = function (a, b) {
        var ra = a.heroRank || 0;
        var rb = b.heroRank || 0;
        if (ra !== rb) return ra - rb;
        return byNewest(a, b);
      };
      var heroes = list.filter(function (i) { return i.hero; }).sort(byRank);
      var featured = list.filter(function (i) { return i.featured; }).sort(byNewest);
      slides = (heroes.length ? heroes : featured.length ? featured : list.slice().sort(byNewest)).slice(0, 5);
      if (!slides.length) return fallback();
      mount();
    });

    function mount() {
      hero.classList.add('hero--media');
      slidesEl.innerHTML = slides.map(function (img, i) {
        var bg = img.lqip ? ' style="background-image:url(' + img.lqip + ')"' : '';
        return '<div class="hero__slide' + (i === 0 ? ' is-active' : '') + '">'
          + '<img src="' + esc(img.file) + '" alt="' + esc(img.caption || '战队影像') + '"'
          + ' loading="' + (i === 0 ? 'eager' : 'lazy') + '"' + bg + ' /></div>';
      }).join('');

      if (metaEl) {
        metaEl.hidden = false;
        totalEl.textContent = pad(slides.length);
        thumbsEl.innerHTML = slides.map(function (img, i) {
          var thumb = img.thumb || img.file;
          return '<button class="hero__thumb' + (i === 0 ? ' is-active' : '') + '" type="button"'
            + ' data-i="' + i + '" aria-label="第 ' + (i + 1) + ' 张：' + esc(img.caption || '') + '"'
            + ' style="background-image:url(' + esc(thumb) + ')"></button>';
        }).join('');
        thumbsEl.addEventListener('click', function (e) {
          var btn = e.target.closest('.hero__thumb');
          if (btn) go(Number(btn.dataset.i), true);
        });
      }

      var label = document.createElement('div');
      label.className = 'hero__side-label';
      label.textContent = 'NJUPT · POTENTIAL — RM 2026';
      hero.appendChild(label);

      updateCaption();
      if (!reduced) start();
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', function () { if (!reduced) start(); });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (window.scrollY > window.innerHeight * 0.7) return;
        if (document.body.classList.contains('nav-open')) return;
        if (lb && lb.classList.contains('is-open')) return;
        go(current + (e.key === 'ArrowRight' ? 1 : -1), true);
      });
    }

    function go(index, manual) {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slidesEl.querySelectorAll('.hero__slide').forEach(function (n, i) {
        n.classList.toggle('is-active', i === current);
      });
      if (thumbsEl) {
        thumbsEl.querySelectorAll('.hero__thumb').forEach(function (t, i) {
          t.classList.toggle('is-active', i === current);
        });
      }
      updateCaption();
      if (manual) { stop(); if (!reduced) start(); }
    }

    function updateCaption() {
      var img = slides[current] || {};
      if (idxEl) idxEl.textContent = pad(current + 1);
      if (capEl) capEl.textContent = img.caption || '';
    }

    function start() { stop(); timer = setInterval(function () { go(current + 1); }, 7000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
  }

  /* ============================================================ 首页照片墙 */
  function initWall() {
    var host = document.getElementById('featuredGallery');
    if (!host) return;

    loadData().then(function (data) {
      if (!data) return;
      var all = visibleItems(data.images);
      if (!all.length) return;

      var picks = all.filter(function (i) { return i.featured; });
      if (picks.length < 4) picks = all;
      picks = picks.slice(0, 7);

      var html = picks.map(function (img) {
        return '<figure class="shot" tabindex="0" role="button" data-full="' + esc(img.file) + '">'
          + '<img src="' + esc(img.thumb || img.file) + '" alt="' + esc(img.caption || '战队影像') + '"'
          + (img.lqip ? ' style="background-image:url(' + img.lqip + ');background-size:cover;"' : '')
          + ' loading="lazy" />'
          + '<span class="shot__zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5"/></svg></span>'
          + '<figcaption>' + esc(img.caption || '') + '</figcaption>'
          + '</figure>';
      }).join('');

      html += '<a class="shot shot--more" href="gallery.html">'
        + '<span>View All</span><b>全部 ' + all.length + ' 张影像</b></a>';

      host.innerHTML = html;
      var section = host.closest('.section');
      if (section) section.hidden = false;
      bindOpen(host, function () {
        return all.filter(function (i) {
          return picks.some(function (p) { return p.file === i.file; });
        });
      });
    });
  }

  /* ============================================================ 画廊页 */
  function initGallery() {
    var root = document.getElementById('galleryApp');
    if (!root) return;

    loadData().then(function (data) {
      var albums = (data && data.albums) || [];
      var images = visibleItems(data && data.images);
      var gridEl = document.getElementById('galleryGrid');
      var tabsEl = document.getElementById('galleryTabs');
      var emptyEl = document.getElementById('galleryEmpty');
      var countEl = document.getElementById('galleryCount');
      var albumStrip = document.getElementById('albumStrip');
      var barEl = document.getElementById('galleryBar');

      if (!images.length) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;
      if (barEl) barEl.hidden = false;

      var withImages = albums.map(function (a) {
        return { album: a, items: images.filter(function (i) { return i.album === a.id; }) };
      }).filter(function (x) { return x.items.length; });

      var current = 'all';

      function coverFor(a) {
        if (a.cover) return a.cover;
        var first = images.filter(function (i) { return i.album === a.id; })[0];
        return first ? (first.thumb || first.file) : '';
      }

      function renderCovers() {
        if (!albumStrip) return;
        var firstThumb = images[0].thumb || images[0].file;
        albumStrip.innerHTML = ''
          + '<button class="album-card' + (current === 'all' ? ' is-active' : '') + '" data-album="all" type="button">'
          + '  <img src="' + esc(firstThumb) + '" alt="" />'
          + '  <span class="album-card__body"><span class="album-card__en">All Photos</span>'
          + '  <span class="album-card__title">全部<em>' + images.length + '</em></span></span>'
          + '</button>'
          + withImages.map(function (x) {
            var a = x.album, cover = coverFor(a);
            return '<button class="album-card' + (current === a.id ? ' is-active' : '') + '" data-album="' + a.id + '" type="button">'
              + (cover ? '<img src="' + esc(cover) + '" alt="" />' : '')
              + '<span class="album-card__body">'
              + '<span class="album-card__en">' + esc(a.en || '') + '</span>'
              + '<span class="album-card__title">' + esc(a.title) + '<em>' + x.items.length + '</em></span>'
              + '</span></button>';
          }).join('');
      }

      function renderTabs() {
        if (!tabsEl) return;
        var items = [{ id: 'all', title: '全部' }].concat(withImages.map(function (x) { return x.album; }));
        tabsEl.innerHTML = items.map(function (a) {
          var n = a.id === 'all' ? images.length : images.filter(function (i) { return i.album === a.id; }).length;
          return '<button type="button" role="tab" data-album="' + a.id + '" class="'
            + (current === a.id ? 'is-active' : '') + '">' + esc(a.title)
            + '<em>' + n + '</em></button>';
        }).join('');
      }

      function renderGrid() {
        var list = current === 'all' ? images : images.filter(function (i) { return i.album === current; });
        if (countEl) countEl.textContent = String(list.length);
        gridEl.innerHTML = list.map(function (img) {
          var ratio = img.w && img.h ? (img.h / img.w) : 0.66;
          return ''
            + '<figure class="gshot" tabindex="0" role="button" data-full="' + esc(img.file) + '">'
            + '  <div class="gshot__frame" style="padding-top:' + (ratio * 100).toFixed(2) + '%;'
            + (img.lqip ? 'background-image:url(' + img.lqip + ');' : '') + '">'
            + '    <img src="' + esc(img.thumb || img.file) + '" alt="' + esc(img.caption || '战队影像') + '"'
            + '      loading="lazy" style="position:absolute;inset:0;height:100%;object-fit:cover;" />'
            + '  </div>'
            + '  <figcaption><span>' + esc(img.caption || '') + '</span>'
            + '  <span>' + (img.w && img.h ? img.w + '×' + img.h : '') + '</span></figcaption>'
            + '</figure>';
        }).join('');

        gridEl.querySelectorAll('img').forEach(function (im) {
          if (im.complete) im.classList.add('is-loaded');
          else im.addEventListener('load', function () { im.classList.add('is-loaded'); });
        });
      }

      function select(album) {
        current = album;
        renderCovers();
        renderTabs();
        renderGrid();
      }

      [albumStrip, tabsEl].forEach(function (el) {
        if (!el) return;
        el.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-album]');
          if (btn) select(btn.dataset.album);
        });
      });

      bindOpen(gridEl, function () {
        return current === 'all' ? images : images.filter(function (i) { return i.album === current; });
      });

      renderCovers();
      renderTabs();
      renderGrid();
    });
  }

  /* ============================================================ 引文带底图 */
  function initQuoteBand() {
    var band = document.querySelector('[data-quote-photo]');
    if (!band) return;
    var bg = band.querySelector('.quote-band__bg');
    if (!bg) return;
    loadData().then(function (data) {
      var list = visibleItems(data && data.images);
      if (!list.length) { bg.classList.add('is-empty'); return; }
      var pick = list.filter(function (i) { return i.featured; })[1] || list[0];
      var img = new Image();
      img.onload = function () { bg.style.backgroundImage = 'url("' + pick.file + '")'; };
      img.src = pick.file;
    });
  }

  function boot() {
    initHero();
    initQuoteBand();
    initWall();
    initGallery();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
