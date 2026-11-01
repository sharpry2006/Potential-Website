/* ==========================================================================
   ⌘K 快速跳转面板 —— 页面 / 章节 / 相册的统一索引
   打开：⌘K 或 Ctrl+K，也可以点右上角搜索图标（若有）
   ========================================================================== */
(function () {
  'use strict';

  var PAGES = [
    { href: 'index.html', title: '首页', en: 'Home', desc: '战队印象、影像与最新动态' },
    { href: 'about.html', title: '战队', en: 'Team', desc: '战队简介、技术方向与赛季节奏' },
    { href: 'robots.html', title: '机甲与团队', en: 'Machines', desc: '七大兵种与技术栈' },
    { href: 'gallery.html', title: '影像', en: 'Gallery', desc: '照片库：赛场、机甲、实验室、团队' },
    { href: 'results.html', title: '战绩', en: 'Results', desc: '赛季成绩与交手记录' },
    { href: 'hall.html', title: '名人堂', en: 'Hall of Fame', desc: '荣誉墙与成员档案' },
    { href: 'join.html', title: '加入我们', en: 'Join', desc: '招募方向与流程' }
  ];

  var items = [];
  var active = 0;
  var box = null;
  var isOpen = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function currentPage() {
    var f = location.pathname.split('/').pop() || 'index.html';
    return f;
  }

  /* ---------------------------------------------------- 建立索引 */
  function buildIndex() {
    items = [];

    // 1) 站内页面
    PAGES.forEach(function (p) {
      var isCurrent = p.href === currentPage();
      items.push({
        type: 'page',
        label: p.title,
        sub: p.desc,
        en: p.en,
        href: p.href,
        badge: isCurrent ? '当前页' : '页面'
      });
    });

    // 2) 当前页的章节
    var sections = document.querySelectorAll('main section[id]');
    sections.forEach(function (sec) {
      var head = sec.querySelector('.h2, .h1');
      if (!head) return;
      var text = head.textContent.trim().replace(/\s+/g, ' ');
      if (!text) return;
      items.push({
        type: 'section',
        label: text,
        sub: '跳到本节',
        en: 'Section',
        href: '#' + sec.id,
        badge: '本节'
      });
    });

    // 3) 影像相册（异步补充）
    fetch('assets/data/gallery.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        if (!data) return;
        ((data.albums || [])).forEach(function (a) {
          var n = (data.images || []).filter(function (i) {
            return i.album === a.id && i.visible !== false;
          }).length;
          if (!n) return;
          items.push({
            type: 'album',
            label: a.title + ' 相册',
            sub: (a.desc || '') + '（' + n + ' 张）',
            en: a.en || 'Album',
            href: 'gallery.html',
            badge: '相册'
          });
        });
      });
  }

  /* ---------------------------------------------------- 渲染 */
  function ensureBox() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'cmdk';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '快速跳转');
    box.innerHTML = ''
      + '<div class="cmdk__panel">'
      + '  <div class="cmdk__input-row">'
      + '    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"/><path d="M16 16l4.4 4.4"/></svg>'
      + '    <input class="cmdk__input" type="text" placeholder="搜索页面、章节或相册…" autocomplete="off" spellcheck="false" />'
      + '    <kbd class="cmdk__kbd">ESC</kbd>'
      + '  </div>'
      + '  <div class="cmdk__list" role="listbox"></div>'
      + '  <div class="cmdk__foot">'
      + '    <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>'
      + '    <span><kbd>↵</kbd> 前往</span>'
      + '    <span class="cmdk__brand">POTENTIAL</span>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(box);

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.cmdk__kbd')) close();
    });

    var input = box.querySelector('.cmdk__input');
    input.addEventListener('input', function () {
      active = 0;
      render(input.value);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
    });
    box.querySelector('.cmdk__list').addEventListener('click', function (e) {
      var row = e.target.closest('[data-idx]');
      if (!row) return;
      active = Number(row.dataset.idx);
      go();
    });
    return box;
  }

  function match(q) {
    q = q.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items.filter(function (it) {
      return (it.label + ' ' + (it.sub || '') + ' ' + (it.en || '')).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 12);
  }

  var shown = [];

  function render(q) {
    shown = match(q);
    var list = box.querySelector('.cmdk__list');
    if (!shown.length) {
      list.innerHTML = '<div class="cmdk__empty">没有找到「' + esc(q) + '」相关的内容</div>';
      return;
    }
    if (active >= shown.length) active = shown.length - 1;
    list.innerHTML = shown.map(function (it, i) {
      return '<button class="cmdk__item' + (i === active ? ' is-active' : '') + '" type="button" data-idx="' + i + '">'
        + '  <span class="cmdk__badge">' + esc(it.badge) + '</span>'
        + '  <span class="cmdk__text"><b>' + esc(it.label) + '</b>'
        + (it.sub ? '<em>' + esc(it.sub) + '</em>' : '') + '</span>'
        + '  <span class="cmdk__en">' + esc(it.en || '') + '</span>'
        + '</button>';
    }).join('');
  }

  function move(d) {
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    var list = box.querySelector('.cmdk__list');
    list.querySelectorAll('.cmdk__item').forEach(function (el, i) {
      el.classList.toggle('is-active', i === active);
    });
    var el = list.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  function go() {
    var it = shown[active];
    if (!it) return;
    var href = it.href;
    close();
    if (href.charAt(0) === '#') {
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    } else {
      location.href = href;
    }
  }

  function open() {
    ensureBox();
    isOpen = true;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    buildIndex();
    var input = box.querySelector('.cmdk__input');
    input.value = '';
    render('');
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    if (!box) return;
    isOpen = false;
    box.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }
    if (e.key === 'Escape' && isOpen) { close(); return; }
    if (e.key === '/' && !isOpen) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      open();
    }
  });

  // 暴露给站点里的按钮
  window.PotentialSearch = { open: open, close: close };
})();
