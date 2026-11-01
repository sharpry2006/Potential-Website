/* ==========================================================================
   图片管理后台 v2
   多选批量 / 首页大图 / 相册封面 / 筛选 / 撤销 / 存储统计
   ========================================================================== */
(function () {
  'use strict';

  var state = { albums: [], images: [] };
  var currentAlbum = 'all';
  var currentFlag = 'all';
  var sortBy = 'custom';
  var selected = new Set();
  var dirty = false;
  var saveTimer = null;
  var undoData = null;
  var undoTimer = null;

  var $ = function (sel) { return document.querySelector(sel); };
  var loginScreen = $('#loginScreen');
  var app = $('#adminApp');
  var grid = $('#grid');
  var toastEl = $('#toast');

  /* ------------------------------------------------------------ 基础 */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(path, body, isForm) {
    var opts = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin' };
    if (body !== undefined) {
      if (isForm) {
        opts.body = body;
      } else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }
    }
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () {
        return { ok: false, error: 'HTTP ' + r.status };
      }).then(function (data) {
        if (!r.ok && data.ok !== true) {
          var err = new Error(data.error || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  var toastTimer;
  function toast(msg, isErr) {
    toastEl.textContent = msg;
    toastEl.style.borderLeftColor = isErr ? '#ff3d2e' : 'var(--accent)';
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on');
      setTimeout(function () { toastEl.hidden = true; }, 320);
    }, 2600);
  }

  function setDirty(v) {
    dirty = v;
    var el = $('#saveState');
    el.textContent = v ? '保存中…' : '已保存';
    el.classList.toggle('is-dirty', v);
  }

  /* ------------------------------------------------------------ 登录 */
  function showLogin() {
    loginScreen.hidden = false;
    app.hidden = true;
    var pw = $('#password');
    if (pw) pw.focus();
  }
  function showApp() {
    loginScreen.hidden = true;
    app.hidden = false;
    loadState();
    loadHall();
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var errEl = $('#loginErr');
    errEl.hidden = true;
    api('/api/login', { password: $('#password').value })
      .then(showApp)
      .catch(function (err) {
        errEl.textContent = err.message || '登录失败';
        errEl.hidden = false;
      });
  });

  $('#logoutBtn').addEventListener('click', function () {
    api('/api/logout', {}).then(showLogin).catch(showLogin);
  });

  /* ------------------------------------------------------------ 数据 */
  function loadState() {
    api('/api/state').then(function (data) {
      state.albums = data.albums || [];
      state.images = data.images || [];
      var ids = new Set(state.images.map(function (i) { return i.id; }));
      selected.forEach(function (id) { if (!ids.has(id)) selected.delete(id); });
      render();
    }).catch(function (err) {
      if (err.status === 401) showLogin();
      else toast('读取失败：' + err.message, true);
    });
  }

  function albumTitle(id) {
    for (var i = 0; i < state.albums.length; i++) {
      if (state.albums[i].id === id) return state.albums[i].title;
    }
    return '未分类';
  }

  function albumOptions(selectedId) {
    return state.albums.map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>'
        + esc(a.title) + '</option>';
    }).join('');
  }

  /* ------------------------------------------------------------ 渲染 */
  function render() {
    renderAlbumSelects();
    renderFilters();
    renderGrid();
    renderHero();
    renderAlbums();
    renderStorage();
    renderBulkbar();
    $('#imgCount').textContent = String(state.images.length);
  }

  function renderAlbumSelects() {
    var upload = $('#uploadAlbum');
    var bulk = $('#bulkAlbum');
    var keepUpload = upload.value;
    var keepBulk = bulk.value;
    upload.innerHTML = state.albums.map(function (a) {
      return '<option value="' + a.id + '">' + esc(a.title) + '</option>';
    }).join('');
    bulk.innerHTML = '<option value="">移动到相册…</option>' + state.albums.map(function (a) {
      return '<option value="' + a.id + '">' + esc(a.title) + '</option>';
    }).join('');
    if (keepUpload && state.albums.some(function (a) { return a.id === keepUpload; })) upload.value = keepUpload;
    if (keepBulk && state.albums.some(function (a) { return a.id === keepBulk; })) bulk.value = keepBulk;
  }

  function renderFilters() {
    var wrap = $('#albumFilter');
    var items = [{ id: 'all', title: '全部' }].concat(state.albums);
    wrap.innerHTML = items.map(function (a) {
      var n = a.id === 'all' ? state.images.length : state.images.filter(function (i) { return i.album === a.id; }).length;
      return '<button type="button" data-album="' + a.id + '" class="' + (currentAlbum === a.id ? 'is-active' : '') + '">'
        + esc(a.title) + ' <span style="opacity:.55">' + n + '</span></button>';
    }).join('');
    $('#flagFilter').querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.flag === currentFlag);
    });
  }

  function renderStorage() {
    var el = $('#storage');
    if (!el) return;
    var total = state.images.length;
    var featured = state.images.filter(function (i) { return i.featured; }).length;
    var hidden = state.images.filter(function (i) { return i.visible === false; }).length;
    var heroes = state.images.filter(function (i) { return i.hero; }).length;
    el.innerHTML = ''
      + '<span><b>' + total + '</b>Photos</span>'
      + '<span><b>' + featured + '</b>Featured</span>'
      + '<span><b>' + heroes + '</b>Hero</span>'
      + '<span><b>' + hidden + '</b>Hidden</span>';
  }

  function filtered() {
    var list = state.images.slice();
    if (currentAlbum !== 'all') list = list.filter(function (i) { return i.album === currentAlbum; });
    if (currentFlag === 'featured') list = list.filter(function (i) { return i.featured; });
    else if (currentFlag === 'hidden') list = list.filter(function (i) { return i.visible === false; });
    if (sortBy === 'new') list.sort(function (a, b) { return (b.order || 0) - (a.order || 0); });
    else if (sortBy === 'old') list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    else if (sortBy === 'name') list.sort(function (a, b) {
      return String(a.caption || '').localeCompare(String(b.caption || ''), 'zh-Hans-CN');
    });
    else list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    return list;
  }

  function renderGrid() {
    var list = filtered();
    $('#emptyState').hidden = list.length > 0;

    grid.innerHTML = list.map(function (img) {
      var isSel = selected.has(img.id);
      var badges = '';
      if (img.hero) badges += '<span class="badge badge--hero" title="出现在首页首屏轮播">HOME</span>';
      if (img.featured) badges += '<span class="badge badge--star">精选</span>';
      if (img.visible === false) badges += '<span class="badge badge--off">已隐藏</span>';
      var size = img.w && img.h ? img.w + '×' + img.h : '';
      return ''
        + '<article class="tile' + (img.visible === false ? ' is-hidden-img' : '')
        + (isSel ? ' is-selected' : '') + (img.hero ? ' is-hero' : '') + '" draggable="true" data-id="' + img.id + '">'
        + '  <div class="tile__thumb" title="拖动可调整顺序">'
        + '    <img src="' + esc(img.thumb || img.file) + '" alt="" loading="lazy" />'
        + '    <input class="tile__select" type="checkbox" data-act="select"' + (isSel ? ' checked' : '')
        + '      aria-label="选择这张图片" />'
        + '    <div class="tile__badges">' + badges + '</div>'
        + '    <button class="tile__hero" type="button" data-act="hero" title="设为首页大图">'
        + '      <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>'
        + '      首页大图</button>'
        + '    <div class="tile__tools">'
        + '      <button class="icon-btn" type="button" data-act="feature" title="设为精选">'
        + '        <svg viewBox="0 0 24 24"><path d="M12 4.5l2.3 5 5.4.7-4 3.7 1 5.3-4.7-2.6L7.3 19l1-5.3-4-3.7 5.4-.7z"/></svg>'
        + '      </button>'
        + '      <button class="icon-btn" type="button" data-act="toggle" title="显示 / 隐藏">'
        + '        <svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>'
        + '      </button>'
        + '      <button class="icon-btn" type="button" data-act="preview" title="预览">'
        + '        <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5"/></svg>'
        + '      </button>'
        + '      <button class="icon-btn" type="button" data-act="delete" title="删除">'
        + '        <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
        + '      </button>'
        + '    </div>'
        + '  </div>'
        + '  <div class="tile__body">'
        + '    <input class="tile__caption" type="text" value="' + esc(img.caption) + '" placeholder="写一句图注…" data-act="caption" />'
        + '    <div class="tile__meta">'
        + '      <select data-act="album">' + albumOptions(img.album) + '</select>'
        + '      <span class="tile__size">' + size + '</span>'
        + '    </div>'
        + '  </div>'
        + '</article>';
    }).join('');
  }

  function renderAlbums() {
    $('#albums').innerHTML = state.albums.map(function (a, i) {
      var covers = state.images.filter(function (im) { return im.album === a.id; });
      return ''
        + '<div class="album-row" data-idx="' + i + '">'
        + '  <input type="text" value="' + esc(a.title) + '" data-act="album-title" placeholder="相册名" />'
        + '  <input type="text" value="' + esc(a.en) + '" data-act="album-en" placeholder="英文名" />'
        + '  <input type="text" value="' + esc(a.desc) + '" data-act="album-desc" placeholder="简介（显示在画廊页）" />'
        + '  <select data-act="album-cover" class="select-sm" title="相册封面">'
        + '    <option value="">封面：自动</option>'
        + covers.map(function (im) {
          var v = im.thumb || im.file;
          return '<option value="' + esc(v) + '"' + (a.cover === v ? ' selected' : '') + '>'
            + esc(im.caption || im.file.split('/').pop()) + '</option>';
        }).join('')
        + '  </select>'
        + '  <button class="icon-btn" type="button" data-act="album-delete" title="删除相册">'
        + '    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
        + '  </button>'
        + '</div>';
    }).join('');
  }

  function renderBulkbar() {
    var bar = $('#bulkbar');
    var n = selected.size;
    bar.classList.toggle('is-idle', n === 0);
    $('#selCount').textContent = String(n);
    var all = filtered();
    $('#selectAll').checked = all.length > 0 && all.every(function (i) { return selected.has(i.id); });
    // 没有选中时，批量动作不可用（但全选框始终可见）
    bar.querySelectorAll('.bulkbar__actions button, .bulkbar__actions select').forEach(function (el) {
      el.disabled = n === 0;
    });
  }


  /* ------------------------------------------------------------ 首屏轮播编辑器 */
  var HERO_MAX = 5;

  function heroList() {
    return state.images
      .filter(function (i) { return i.hero; })
      .sort(function (a, b) {
        var ra = a.heroRank || 0, rb = b.heroRank || 0;
        if (ra !== rb) return ra - rb;
        return (b.order || 0) - (a.order || 0);
      });
  }

  function renderHero() {
    var list = heroList();
    var slots = $('#heroSlots');
    if (!slots) return;
    $('#heroCount').textContent = list.length + ' / ' + HERO_MAX;

    var html = list.map(function (img, i) {
      return ''
        + '<div class="hero-slot" draggable="true" data-id="' + img.id + '">'
        + '  <span class="hero-slot__no">' + (i + 1) + '</span>'
        + '  <button class="hero-slot__del" type="button" data-hero-del="' + img.id + '" aria-label="移出轮播">✕</button>'
        + '  <img src="' + esc(img.thumb || img.file) + '" alt="" />'
        + (img.caption ? '<span class="hero-slot__cap">' + esc(img.caption) + '</span>' : '')
        + '</div>';
    }).join('');

    for (var k = list.length; k < HERO_MAX; k++) {
      html += '<div class="hero-slot is-empty">空位 ' + (k + 1) + '</div>';
    }
    slots.innerHTML = html;

    // 达到上限时禁用「添加图片」
    var addBtn = $('#heroAdd');
    if (addBtn) {
      var full = list.length >= HERO_MAX;
      addBtn.disabled = full;
      addBtn.textContent = full ? '已达 5 张上限' : '添加图片';
      addBtn.title = full ? '先移出一张，再添加新的' : '从图库中选择图片加入轮播';
    }
    if (list.length > HERO_MAX && $('#heroPicker').hidden) {
      toast('轮播最多显示 5 张，超出的不会出现在首页', true);
    }
  }

  function renderHeroPicker() {
    var grid = $('#heroPickerGrid');
    if (!grid) return;
    var inHero = new Set(heroList().map(function (i) { return i.id; }));
    var items = state.images.filter(function (i) { return !inHero.has(i.id); });
    if (!items.length) {
      grid.innerHTML = '<div class="hero-picker__empty">图库里的图片都已经在轮播中了。先去上传更多照片吧。</div>';
      return;
    }
    grid.innerHTML = items.map(function (img) {
      return '<button class="hero-picker__item" type="button" data-hero-add="' + img.id + '"'
        + ' title="' + esc(img.caption || '') + '">'
        + '<img src="' + esc(img.thumb || img.file) + '" alt="" loading="lazy" /></button>';
    }).join('');
  }

  // 拖拽排序
  var heroDragId = null;
  document.addEventListener('dragstart', function (e) {
    var slot = e.target.closest('.hero-slot[data-id]');
    if (!slot) return;
    heroDragId = slot.dataset.id;
    slot.classList.add('is-dragging');
    try { e.dataTransfer.setData('text/plain', heroDragId); } catch (err) {}
  });
  document.addEventListener('dragend', function (e) {
    var slot = e.target.closest('.hero-slot');
    if (slot) slot.classList.remove('is-dragging');
    document.querySelectorAll('.hero-slot.is-drop-target').forEach(function (s) {
      s.classList.remove('is-drop-target');
    });
  });
  document.addEventListener('dragover', function (e) {
    var slot = e.target.closest('.hero-slot[data-id]');
    if (!slot || !heroDragId) return;
    e.preventDefault();
    document.querySelectorAll('.hero-slot.is-drop-target').forEach(function (s) {
      s.classList.remove('is-drop-target');
    });
    if (slot.dataset.id !== heroDragId) slot.classList.add('is-drop-target');
  });
  document.addEventListener('drop', function (e) {
    var slot = e.target.closest('.hero-slot[data-id]');
    if (!slot || !heroDragId) return;
    e.preventDefault();
    e.stopPropagation();
    var targetId = slot.dataset.id;
    var dragId = heroDragId;
    heroDragId = null;
    if (targetId === dragId) return;

    var list = heroList();
    var from = list.findIndex(function (i) { return i.id === dragId; });
    var to = list.findIndex(function (i) { return i.id === targetId; });
    if (from < 0 || to < 0) return;
    var moved = list.splice(from, 1)[0];
    list.splice(to, 0, moved);
    list.forEach(function (img, i) { img.heroRank = i; });
    renderHero();
    saveNow(true).then(function () { toast('轮播顺序已更新'); });
  });

  // 移出 / 加入
  $('#heroSlots').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-hero-del]');
    if (!btn) return;
    var img = state.images.filter(function (i) { return i.id === btn.dataset.heroDel; })[0];
    if (!img) return;
    img.hero = false;
    img.heroRank = 0;
    renderHero(); renderHeroPicker(); renderGrid(); renderStorage();
    saveNow(true).then(function () { toast('已移出轮播'); });
  });

  $('#heroAdd').addEventListener('click', function () {
    var picker = $('#heroPicker');
    picker.hidden = !picker.hidden;
    if (!picker.hidden) renderHeroPicker();
  });
  $('#heroPickerClose').addEventListener('click', function () {
    $('#heroPicker').hidden = true;
  });
  $('#heroPickerGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-hero-add]');
    if (!btn) return;
    if (heroList().length >= HERO_MAX) { toast('轮播最多 5 张', true); return; }
    var img = state.images.filter(function (i) { return i.id === btn.dataset.heroAdd; })[0];
    if (!img) return;
    img.hero = true;
    img.heroRank = heroList().length;
    renderHero(); renderHeroPicker(); renderGrid(); renderStorage();
    saveNow(true).then(function () { toast('已加入轮播'); });
  });

  /* ------------------------------------------------------------ 保存 */
  function scheduleSave() {
    setDirty(true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 600);
  }

  function flushSave() {
    return api('/api/save', { albums: state.albums, images: state.images }).then(function (res) {
      state.albums = res.state.albums;
      state.images = res.state.images;
      setDirty(false);
      renderFilters();
      renderStorage();
    }).catch(function (err) {
      setDirty(false);
      toast('保存失败：' + err.message, true);
    });
  }

  function saveNow(silent) {
    clearTimeout(saveTimer);
    setDirty(true);
    return flushSave().then(function () {
      render();
      if (!silent) toast('已保存');
    });
  }

  /* ------------------------------------------------------------ 卡片交互 */
  grid.addEventListener('click', function (e) {
    var tile = e.target.closest('.tile');
    if (!tile) return;
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var img = state.images.filter(function (i) { return i.id === tile.dataset.id; })[0];
    if (!img) return;
    var act = btn.dataset.act;

    if (act === 'feature') {
      img.featured = !img.featured;
      scheduleSave(); renderGrid(); renderStorage();
    } else if (act === 'hero') {
      var willOn = !img.hero;
      img.hero = willOn;
      img.heroRank = willOn ? heroList().length : 0;
      scheduleSave(); renderGrid(); renderStorage(); renderHero(); renderHeroPicker();
      toast(willOn ? '已加入首屏轮播（顺序在顶部调整）' : '已从首屏移除');
    } else if (act === 'toggle') {
      img.visible = !img.visible;
      scheduleSave(); renderGrid(); renderStorage();
    } else if (act === 'preview') {
      preview(img);
    } else if (act === 'delete') {
      removeImages([img.id]);
    }
  });

  grid.addEventListener('change', function (e) {
    var el = e.target;
    var tile = el.closest('.tile');
    if (!tile) return;
    if (el.dataset.act === 'select') {
      if (el.checked) selected.add(tile.dataset.id); else selected.delete(tile.dataset.id);
      tile.classList.toggle('is-selected', el.checked);
      renderBulkbar();
      return;
    }
    if (el.dataset.act === 'album') {
      var img = state.images.filter(function (i) { return i.id === tile.dataset.id; })[0];
      if (!img) return;
      img.album = el.value;
      scheduleSave(); renderFilters();
    }
  });

  grid.addEventListener('input', function (e) {
    var el = e.target;
    var tile = el.closest('.tile');
    if (!tile || el.dataset.act !== 'caption') return;
    var img = state.images.filter(function (i) { return i.id === tile.dataset.id; })[0];
    if (!img) return;
    img.caption = el.value;
    scheduleSave();
  });

  /* 拖拽排序 */
  var dragId = null;
  grid.addEventListener('dragstart', function (e) {
    var tile = e.target.closest('.tile');
    if (!tile) return;
    dragId = tile.dataset.id;
    tile.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {}
  });
  grid.addEventListener('dragend', function (e) {
    var tile = e.target.closest('.tile');
    if (tile) tile.classList.remove('is-dragging');
    grid.querySelectorAll('.is-drop-target').forEach(function (t) { t.classList.remove('is-drop-target'); });
  });
  grid.addEventListener('dragover', function (e) {
    var tile = e.target.closest('.tile');
    if (!tile || !dragId) return;
    e.preventDefault();
    grid.querySelectorAll('.is-drop-target').forEach(function (t) { t.classList.remove('is-drop-target'); });
    if (tile.dataset.id !== dragId) tile.classList.add('is-drop-target');
  });
  grid.addEventListener('drop', function (e) {
    var tile = e.target.closest('.tile');
    if (!tile || !dragId) return;
    e.preventDefault();
    var targetId = tile.dataset.id;
    if (targetId === dragId) return;
    var ordered = filtered();
    var from = ordered.findIndex(function (i) { return i.id === dragId; });
    var to = ordered.findIndex(function (i) { return i.id === targetId; });
    if (from < 0 || to < 0) return;
    var moved = ordered.splice(from, 1)[0];
    ordered.splice(to, 0, moved);
    var base = Date.now();
    ordered.forEach(function (img, i) { img.order = base + i; });
    dragId = null;
    scheduleSave(); renderGrid();
  });

  /* 筛选 */
  $('#albumFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-album]');
    if (!btn) return;
    currentAlbum = btn.dataset.album;
    renderFilters(); renderGrid(); renderBulkbar();
  });
  $('#flagFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-flag]');
    if (!btn) return;
    currentFlag = btn.dataset.flag;
    renderFilters(); renderGrid(); renderBulkbar();
  });

  $('#sortBy').addEventListener('change', function (e) {
    sortBy = e.target.value;
    // 非自定义排序时禁用拖拽排序，避免误解
    grid.classList.toggle('is-sorted', sortBy !== 'custom');
    renderGrid();
  });

  /* 全选 */
  $('#selectAll').addEventListener('change', function (e) {
    var all = filtered();
    if (e.target.checked) all.forEach(function (i) { selected.add(i.id); });
    else all.forEach(function (i) { selected.delete(i.id); });
    renderGrid(); renderBulkbar();
  });

  /* 批量 */
  document.querySelector('.bulkbar__actions').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-bulk]');
    if (!btn) return;
    var ids = Array.from(selected);
    if (!ids.length) return;
    var act = btn.dataset.bulk;
    if (act === 'delete') { removeImages(ids, false); return; }
    if (act === 'purge') { removeImages(ids, true); return; }

    state.images.forEach(function (img) {
      if (ids.indexOf(img.id) < 0) return;
      if (act === 'feature') img.featured = true;
      else if (act === 'unfeature') img.featured = false;
      else if (act === 'hero') img.hero = true;
      else if (act === 'hide') img.visible = false;
      else if (act === 'show') img.visible = true;
    });
    saveNow(true).then(function () { toast('已更新 ' + ids.length + ' 张图片'); });
  });

  $('#bulkAlbum').addEventListener('change', function (e) {
    var target = e.target.value;
    if (!target) return;
    var ids = Array.from(selected);
    state.images.forEach(function (img) { if (ids.indexOf(img.id) >= 0) img.album = target; });
    e.target.value = '';
    saveNow(true).then(function () { toast('已移动 ' + ids.length + ' 张到「' + albumTitle(target) + '」'); });
  });

  /* 删除 + 撤销 */
  function removeImages(ids, purge) {
    if (!ids.length) return;
    var tip = purge
      ? (ids.length > 1 ? ('永久删除这 ' + ids.length + ' 张图片？文件会从磁盘删除，无法找回。') : '永久删除这张图片？文件会从磁盘删除，无法找回。')
      : (ids.length > 1 ? ('从图库移除这 ' + ids.length + ' 张图片？（文件保留，可用「扫描未入库」找回）') : '从图库移除这张图片？（文件保留，可找回）');
    if (!confirm(tip)) return;

    var removed = state.images.filter(function (i) { return ids.indexOf(i.id) >= 0; });

    // 串行删除：并发会让每次返回的整份状态互相覆盖
    var chain = Promise.resolve();
    ids.forEach(function (id) {
      chain = chain.then(function () {
        return api('/api/delete', { id: id, purge: !!purge });
      });
    });

    chain
      .then(function () {
        ids.forEach(function (id) { selected.delete(id); });
        return api('/api/state');
      })
      .then(function (data) {
        state.albums = data.albums || state.albums;
        state.images = data.images || [];
        render();
        if (purge) { toast('已永久删除 ' + removed.length + ' 张'); return; }
        undoData = removed;
        showUndo('已移除 ' + removed.length + ' 张（文件已保留）');
      })
      .catch(function (err) {
        toast('删除失败：' + err.message, true);
        loadState();
      });
  }

  function showUndo(msg) {
    var bar = $('#undoBar');
    $('#undoText').textContent = msg;
    bar.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { bar.hidden = true; undoData = null; }, 12000);
  }

  $('#undoBtn').addEventListener('click', function () {
    if (!undoData) { $('#undoBar').hidden = true; return; }
    var restored = undoData;
    undoData = null;
    $('#undoBar').hidden = true;
    var existing = new Set(state.images.map(function (i) { return i.id; }));
    var add = restored.filter(function (i) { return !existing.has(i.id); });
    state.images = state.images.concat(add);
    saveNow(true).then(function () {
      render();
      toast('已恢复 ' + add.length + ' 张');
    });
  });

  /* 预览 */
  function preview(img) {
    var box = document.createElement('div');
    box.className = 'lightbox is-open';
    box.innerHTML = ''
      + '<div class="lightbox__top"><span class="lightbox__count">预览</span>'
      + '<div class="lightbox__tools"><button class="lightbox__close" type="button" aria-label="关闭">✕</button></div></div>'
      + '<div class="lightbox__stage"><figure class="lightbox__fig"><img src="' + esc(img.file) + '" alt="" />'
      + '<figcaption>' + esc(img.caption || '') + '</figcaption></figure></div>'
      + '<div class="lightbox__strip"></div>';
    document.body.appendChild(box);
    var close = function () { box.remove(); document.body.style.overflow = ''; };
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox__close')) close();
    });
    var onKey = function (e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
  }

  /* 相册编辑 */
  $('#albums').addEventListener('input', function (e) {
    var row = e.target.closest('.album-row');
    if (!row) return;
    var album = state.albums[Number(row.dataset.idx)];
    if (!album) return;
    var act = e.target.dataset.act;
    if (act === 'album-title') album.title = e.target.value;
    else if (act === 'album-en') album.en = e.target.value;
    else if (act === 'album-desc') album.desc = e.target.value;
    else return;
    scheduleSave();
    renderFilters();
  });

  $('#albums').addEventListener('change', function (e) {
    if (e.target.dataset.act !== 'album-cover') return;
    var row = e.target.closest('.album-row');
    var album = state.albums[Number(row.dataset.idx)];
    if (!album) return;
    album.cover = e.target.value;
    saveNow(true).then(function () { toast('已更新相册封面'); });
  });

  $('#albums').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act="album-delete"]');
    if (!btn) return;
    var idx = Number(btn.closest('.album-row').dataset.idx);
    var album = state.albums[idx];
    if (!album) return;
    if (state.albums.length <= 1) { toast('至少保留一个相册', true); return; }
    var count = state.images.filter(function (i) { return i.album === album.id; }).length;
    if (!confirm('删除相册「' + album.title + '」？' + (count ? '其中 ' + count + ' 张图片会移到第一个相册。' : ''))) return;
    var fallback = state.albums[0].id === album.id ? state.albums[1].id : state.albums[0].id;
    state.images.forEach(function (i) { if (i.album === album.id) i.album = fallback; });
    state.albums.splice(idx, 1);
    saveNow(true).then(function () { render(); toast('相册已删除'); });
  });


  /* ============================================================ 名人堂 */
  var hall = { members: [], honors: [] };
  var hallTab = 'members';
  var hallDirtyTimer = null;

  function loadHall() {
    return api('/api/honors').then(function (data) {
      hall.members = (data.members || []).slice();
      hall.honors = (data.honors || []).slice();
      renderHall();
    }).catch(function (err) { toast('读取名人堂失败：' + err.message, true); });
  }

  function saveHall(silent) {
    return api('/api/honors', { members: hall.members, honors: hall.honors }).then(function (res) {
      hall.members = res.state.members;
      hall.honors = res.state.honors;
      renderHall();
      if (!silent) toast('名人堂已保存');
    }).catch(function (err) { toast('保存失败：' + err.message, true); });
  }

  function scheduleHallSave() {
    clearTimeout(hallDirtyTimer);
    hallDirtyTimer = setTimeout(function () { saveHall(true); }, 700);
  }

  function renderHall() {
    var count = $('#hallCount');
    if (count) count.textContent = hall.members.length + ' / ' + hall.honors.length;
    renderMemberRows();
    renderHonorRows();
    $('#paneMembers').hidden = hallTab !== 'members';
    $('#paneHonors').hidden = hallTab !== 'honors';
    $('#hallTabs').querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.tab === hallTab);
    });
  }

  function renderMemberRows() {
    var host = $('#memberRows');
    var empty = $('#memberRowsEmpty');
    if (!hall.members.length) {
      host.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    host.innerHTML = hall.members.map(function (m, i) {
      var initial = (m.name || '?').trim().slice(0, 1);
      return ''
        + '<div class="row-card' + (m.visible === false ? ' row-card__hidden' : '') + '" draggable="true" data-mid="' + m.id + '">'
        + '  <div class="row-card__avatar" data-avatar="' + m.id + '" title="点击上传头像">'
        + (m.avatar ? '<img src="' + esc(m.avatar) + '" alt="" />' : initial)
        + '  </div>'
        + '  <div class="row-card__fields">'
        + '    <input type="text" value="' + esc(m.name) + '" data-mf="name" placeholder="姓名 *" />'
        + '    <input type="text" value="' + esc(m.nick || '') + '" data-mf="nick" placeholder="花名 / ID" />'
        + '    <input type="text" value="' + esc(m.season || '') + '" data-mf="season" placeholder="赛季，如 2026" />'
        + '    <input type="text" value="' + esc(m.role || '') + '" data-mf="role" placeholder="身份，如 队长 / 视觉负责人" />'
        + '    <input type="text" value="' + esc(m.direction || '') + '" data-mf="direction" placeholder="方向，如 电控" />'
        + '    <input class="full" type="text" value="' + esc(m.note || '') + '" data-mf="note" placeholder="一句话（可选）" />'
        + '  </div>'
        + '  <div class="row-card__tools">'
        + '    <span class="row-card__handle" title="拖动排序">⠿</span>'
        + '    <button class="icon-btn" type="button" data-mact="toggle" title="显示 / 隐藏">'
        + '      <svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>'
        + '    </button>'
        + '    <button class="icon-btn" type="button" data-mact="del" title="删除">'
        + '      <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
        + '    </button>'
        + '  </div>'
        + '</div>';
    }).join('');
  }

  function renderHonorRows() {
    var host = $('#honorRows');
    var empty = $('#honorRowsEmpty');
    if (!hall.honors.length) {
      host.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    host.innerHTML = hall.honors.map(function (h) {
      return ''
        + '<div class="row-card' + (h.visible === false ? ' row-card__hidden' : '') + '" draggable="true" data-hid="' + h.id + '" style="grid-template-columns:minmax(0,1fr) auto">'
        + '  <div class="row-card__fields">'
        + '    <input type="text" value="' + esc(h.year || '') + '" data-hf="year" placeholder="年份" />'
        + '    <input type="text" value="' + esc(h.result || '') + '" data-hf="result" placeholder="成绩，如 季军" />'
        + '    <input class="full" type="text" value="' + esc(h.title) + '" data-hf="title" placeholder="标题 *，如 江苏站季军" />'
        + '    <input class="full" type="text" value="' + esc(h.event || '') + '" data-hf="event" placeholder="赛事 / 事件" />'
        + '    <input type="text" value="' + esc(h.date || '') + '" data-hf="date" placeholder="日期 2026-03-29" />'
        + '    <select data-hf="level">'
        + ['regional:区域赛', 'national:全国赛', 'school:校内', 'team:里程碑'].map(function (o) {
          var kv = o.split(':');
          return '<option value="' + kv[0] + '"' + (h.level === kv[0] ? ' selected' : '') + '>' + kv[1] + '</option>';
        }).join('')
        + '    </select>'
        + '    <input class="full" type="text" value="' + esc(h.note || '') + '" data-hf="note" placeholder="说明（可选）" />'
        + '  </div>'
        + '  <div class="row-card__tools">'
        + '    <span class="row-card__handle" title="拖动排序">⠿</span>'
        + '    <button class="icon-btn" type="button" data-hact="toggle" title="显示 / 隐藏">'
        + '      <svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>'
        + '    </button>'
        + '    <button class="icon-btn" type="button" data-hact="del" title="删除">'
        + '      <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
        + '    </button>'
        + '  </div>'
        + '</div>';
    }).join('');
  }

  // 输入即保存
  $('#memberRows').addEventListener('input', function (e) {
    var card = e.target.closest('[data-mid]');
    if (!card) return;
    var m = hall.members.filter(function (x) { return x.id === card.dataset.mid; })[0];
    if (!m) return;
    var f = e.target.dataset.mf;
    if (!f) return;
    m[f] = e.target.value;
    scheduleHallSave();
  });
  $('#honorRows').addEventListener('input', function (e) {
    var card = e.target.closest('[data-hid]');
    if (!card) return;
    var h = hall.honors.filter(function (x) { return x.id === card.dataset.hid; })[0];
    if (!h) return;
    var f = e.target.dataset.hf;
    if (!f) return;
    h[f] = e.target.value;
    scheduleHallSave();
  });
  $('#honorRows').addEventListener('change', function (e) {
    if (e.target.dataset.hf !== 'level') return;
    var card = e.target.closest('[data-hid]');
    var h = hall.honors.filter(function (x) { return x.id === card.dataset.hid; })[0];
    if (h) { h.level = e.target.value; scheduleHallSave(); }
  });

  // 行内操作
  $('#memberRows').addEventListener('click', function (e) {
    var card = e.target.closest('[data-mid]');
    if (!card) return;
    var m = hall.members.filter(function (x) { return x.id === card.dataset.mid; })[0];
    if (!m) return;
    var act = e.target.closest('[data-mact]');
    if (act) {
      if (act.dataset.mact === 'toggle') { m.visible = m.visible === false; saveHall(true); }
      if (act.dataset.mact === 'del') {
        if (!confirm('删除「' + m.name + '」的档案？')) return;
        hall.members = hall.members.filter(function (x) { return x.id !== m.id; });
        saveHall(true);
      }
      return;
    }
    var av = e.target.closest('[data-avatar]');
    if (av) pickAvatar(av.dataset.avatar);
  });
  $('#honorRows').addEventListener('click', function (e) {
    var card = e.target.closest('[data-hid]');
    if (!card) return;
    var h = hall.honors.filter(function (x) { return x.id === card.dataset.hid; })[0];
    if (!h) return;
    var act = e.target.closest('[data-hact]');
    if (!act) return;
    if (act.dataset.hact === 'toggle') { h.visible = h.visible === false; saveHall(true); }
    if (act.dataset.hact === 'del') {
      if (!confirm('删除荣誉「' + h.title + '」？')) return;
      hall.honors = hall.honors.filter(function (x) { return x.id !== h.id; });
      saveHall(true);
    }
  });

  // 新增
  $('#hallTabs').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    hallTab = btn.dataset.tab;
    renderHall();
  });
  $('#hallAdd').addEventListener('click', function () {
    if (hallTab === 'members') {
      hall.members.push({
        id: 'tmp' + Date.now(), name: '', nick: '', season: '2026',
        role: '', direction: '', note: '', avatar: '',
        order: hall.members.length, visible: true
      });
      renderMemberRows();
      var inputs = document.querySelectorAll('#memberRows [data-mf="name"]');
      if (inputs.length) inputs[inputs.length - 1].focus();
    } else {
      hall.honors.push({
        id: 'tmp' + Date.now(), year: '2026', event: '', title: '', result: '',
        level: 'regional', note: '', date: '', order: hall.honors.length, visible: true
      });
      renderHonorRows();
      var hs = document.querySelectorAll('#honorRows [data-hf="title"]');
      if (hs.length) hs[hs.length - 1].focus();
    }
  });

  // 头像上传
  var avatarTargetId = null;
  function pickAvatar(id) {
    avatarTargetId = id;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var fd = new FormData();
      fd.append('target', 'members');
      fd.append('file', file, file.name);
      toast('正在上传头像…');
      api('/api/upload', fd, true).then(function (res) {
        if (!res.ok || !res.files || !res.files.length) throw new Error('上传失败');
        var m = hall.members.filter(function (x) { return x.id === avatarTargetId; })[0];
        if (!m) return;
        m.avatar = res.files[0].file;
        saveHall(true);
        toast('头像已更新');
      }).catch(function (err) { toast('头像上传失败：' + err.message, true); });
    };
    input.click();
  }

  // 拖拽排序
  var hallDrag = null;
  function bindRowDrag(hostSel, key, idAttr) {
    var host = $(hostSel);
    host.addEventListener('dragstart', function (e) {
      var card = e.target.closest('.row-card');
      if (!card) return;
      hallDrag = card.dataset[idAttr];
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', hallDrag); } catch (err) {}
    });
    host.addEventListener('dragend', function (e) {
      var card = e.target.closest('.row-card');
      if (card) card.classList.remove('is-dragging');
      host.querySelectorAll('.is-drop-target').forEach(function (c) { c.classList.remove('is-drop-target'); });
    });
    host.addEventListener('dragover', function (e) {
      var card = e.target.closest('.row-card');
      if (!card || !hallDrag) return;
      e.preventDefault();
      host.querySelectorAll('.is-drop-target').forEach(function (c) { c.classList.remove('is-drop-target'); });
      if (card.dataset[idAttr] !== hallDrag) card.classList.add('is-drop-target');
    });
    host.addEventListener('drop', function (e) {
      var card = e.target.closest('.row-card');
      if (!card || !hallDrag) return;
      e.preventDefault();
      var targetId = card.dataset[idAttr];
      var dragId = hallDrag;
      hallDrag = null;
      if (targetId === dragId) return;
      var list = hall[key];
      var from = list.findIndex(function (x) { return x.id === dragId; });
      var to = list.findIndex(function (x) { return x.id === targetId; });
      if (from < 0 || to < 0) return;
      var moved = list.splice(from, 1)[0];
      list.splice(to, 0, moved);
      list.forEach(function (x, i) { x.order = i; });
      saveHall(true);
    });
  }
  bindRowDrag('#memberRows', 'members', 'mid');
  bindRowDrag('#honorRows', 'honors', 'hid');

  /* ------------------------------------------------------------ 上传 */
  var dropzone = $('#dropzone');
  var fileInput = $('#fileInput');
  var uploadQueue = [];
  var uploading = false;

  dropzone.addEventListener('click', function () { fileInput.click(); });
  dropzone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.add('is-over');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.remove('is-over');
    });
  });
  dropzone.addEventListener('drop', function (e) {
    enqueue(Array.prototype.slice.call(e.dataTransfer.files || []));
  });
  fileInput.addEventListener('change', function () {
    enqueue(Array.prototype.slice.call(fileInput.files || []));
    fileInput.value = '';
  });

  // 拖到页面任意位置也能上传
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) {
    if (e.target.closest('#dropzone')) return;
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length) {
      dropzone.classList.add('is-over');
      setTimeout(function () { dropzone.classList.remove('is-over'); }, 400);
      enqueue(Array.prototype.slice.call(e.dataTransfer.files));
    }
  });

  function enqueue(files) {
    files = files.filter(function (f) {
      return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|avif|gif|bmp|tiff?)$/i.test(f.name);
    });
    if (!files.length) { toast('没有可上传的图片', true); return; }
    var album = $('#uploadAlbum').value || '';
    files.forEach(function (f) { f.__album = album; });
    uploadQueue = uploadQueue.concat(files);
    if (!uploading) runQueue();
  }

  function runQueue() {
    if (!uploadQueue.length) {
      uploading = false;
      $('#uploadProgress').hidden = true;
      return;
    }
    uploading = true;
    var file = uploadQueue.shift();
    $('#uploadProgress').hidden = false;
    $('#uploadBar').style.width = '0%';
    $('#uploadText').textContent = '上传中：' + file.name;

    var fd = new FormData();
    fd.append('album', file.__album || $('#uploadAlbum').value || '');
    fd.append('file', file, file.name);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true;
    xhr.upload.onprogress = function (ev) {
      if (ev.lengthComputable) $('#uploadBar').style.width = Math.round((ev.loaded / ev.total) * 100) + '%';
    };
    xhr.onload = function () {
      try {
        var res = JSON.parse(xhr.responseText);
        if (res.ok) {
          state.albums = res.state.albums;
          state.images = res.state.images;
          render();
          if (res.errors && res.errors.length) toast(res.errors[0], true);
          $('#uploadText').textContent = '已完成：' + file.name;
        } else {
          toast(res.error || '上传失败', true);
          if (xhr.status === 401) showLogin();
        }
      } catch (e) {
        toast('上传失败（HTTP ' + xhr.status + '）', true);
      }
      runQueue();
    };
    xhr.onerror = function () {
      toast('网络错误，上传中断', true);
      runQueue();
    };
    xhr.send(fd);
  }

  /* 扫描未入库图片 */
  $('#scanBtn').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = '扫描中…';
    api('/api/scan', { import: false }).then(function (res) {
      var n = (res.found || []).length;
      if (!n) { toast('没有发现未入库的图片'); btn.disabled = false; btn.textContent = '扫描未入库'; return; }
      if (!confirm('发现 ' + n + ' 张磁盘上存在但未入库的图片，恢复它们吗？')) {
        btn.disabled = false; btn.textContent = '扫描未入库'; return;
      }
      return api('/api/scan', { import: true }).then(function (r2) {
        state.albums = r2.state.albums;
        state.images = r2.state.images;
        render();
        toast('已恢复 ' + r2.imported + ' 张图片');
      });
    }).catch(function (err) {
      toast('扫描失败：' + err.message, true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = '扫描未入库';
    });
  });

  /* 密码 */
  $('#savePassword').addEventListener('click', function () {
    var val = $('#newPassword').value.trim();
    if (val.length < 6) { toast('密码至少 6 位', true); return; }
    api('/api/password', { password: val }).then(function () {
      $('#newPassword').value = '';
      toast('密码已更新');
    }).catch(function (err) { toast('修改失败：' + err.message, true); });
  });

  /* 键盘快捷键 */
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, select, textarea')) return;
    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      var all = filtered();
      var every = all.length && all.every(function (i) { return selected.has(i.id); });
      all.forEach(function (i) { every ? selected.delete(i.id) : selected.add(i.id); });
      renderGrid(); renderBulkbar();
    }
    if (e.key === 'Delete' && selected.size) removeImages(Array.from(selected));
  });

  /* 启动 */
  api('/api/session').then(function (res) {
    if (res.admin) showApp(); else showLogin();
  }).catch(showLogin);

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
})();
