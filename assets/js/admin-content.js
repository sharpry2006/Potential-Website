/* Admin: edit all site text and the fixed images on each page. Reads each page's HTML, lists data-cms (text) and
   data-cms-img (image) elements, and saves both kinds of override to /api/content in one file. */
(function () {
  'use strict';
  var CMS = window.PotentialCMS;
  var app = document.getElementById('adminApp');
  if (!CMS || !app) return;
  var NL = String.fromCharCode(10);
  var CR = String.fromCharCode(13);
  var PAGES = [['index', '首页'], ['about', '战队'], ['robots', '机甲与团队'], ['results', '战绩'], ['hall', '名人堂'], ['join', '加入我们'], ['gallery', '影像'], ['site', '全站页眉 / 页脚']];
  var $ = function (id) { return document.getElementById(id); };
  var selEl = $('cmsPage'), listEl = $('cmsList'), searchEl = $('cmsSearch'), changedEl = $('cmsChanged');
  var statusEl = $('cmsStatus'), countEl = $('cmsCount'), saveBtn = $('cmsSave'), openEl = $('cmsOpen');
  var imgSel = $('imgPage'), imgGrid = $('imgGrid'), imgStatus = $('imgStatus'), imgCount = $('imgCmsCount'), imgSave = $('imgSave'), imgFile = $('imgFile');
  var edits = {}, origMap = {}, items = [], dirty = false, stale = 0, started = false, current = 'index';
  var imgEdits = {}, imgOrig = {}, imgItems = [], imgDirty = false, pending = null;

  function labelOf(el) {
    var s = el.closest('header,footer,.nav__drawer,section');
    if (!s) return '其他';
    if (s.tagName === 'HEADER') return '页眉导航';
    if (s.classList.contains('nav__drawer')) return '移动端菜单';
    if (s.tagName === 'FOOTER') return '页脚';
    if (s.classList.contains('page-hero') || s.classList.contains('hero')) return '页面顶部';
    if (s.classList.contains('quote-band')) return '引言横幅';
    var h = s.querySelector('h2');
    return h ? CMS.read(h).split(NL).join('') : '内容区';
  }
  function curText(it) { return it.key in edits ? edits[it.key] : it.orig; }
  function size(ta) { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
  function find(key) { return items.filter(function (i) { return i.key === key; })[0]; }
  function abs(src) { return /^(https?:|data:|\/)/.test(src) ? src : '/' + src; }
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fetchPage(page) {
    return fetch((page === 'site' ? 'about' : page) + '.html', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); });
  }

  function updateStatus() {
    var n = Object.keys(edits).length;
    countEl.textContent = n;
    statusEl.classList.toggle('is-dirty', dirty);
    if (dirty) statusEl.textContent = '有未保存的修改（共 ' + n + ' 处）';
    else if (stale) statusEl.textContent = '共 ' + n + ' 处修改 · ' + stale + ' 条旧修改因页面改版已失效并忽略';
    else statusEl.textContent = '共 ' + n + ' 处修改';
  }
  function setDirty(v) { dirty = v; updateStatus(); }
  function updateImgStatus() {
    var n = Object.keys(imgEdits).length;
    imgCount.textContent = n;
    imgStatus.classList.toggle('is-dirty', imgDirty);
    imgStatus.textContent = imgDirty ? '有未保存的图片替换（共 ' + n + ' 处）' : '共替换 ' + n + ' 处';
  }
  function setImgDirty(v) { imgDirty = v; updateImgStatus(); }

  /* ---------------------------------------------------------------- text */
  function render() {
    var q = searchEl.value.trim().toLowerCase();
    var only = changedEl.checked;
    var groups = {}, order = [];
    listEl.textContent = '';
    items.forEach(function (it) {
      var cur = curText(it);
      if (only && cur === it.orig) return;
      if (q && (cur + ' ' + it.orig).toLowerCase().indexOf(q) < 0) return;
      if (!groups[it.group]) { groups[it.group] = []; order.push(it.group); }
      groups[it.group].push(it);
    });
    if (!order.length) { listEl.textContent = '没有匹配的文字。'; updateStatus(); return; }
    order.forEach(function (g) {
      var box = make('div', 'cms-group');
      box.appendChild(make('h3', '', g + '  ·  ' + groups[g].length));
      groups[g].forEach(function (it) {
        var cur = curText(it);
        var row = make('div', 'cms-row' + (cur !== it.orig ? ' is-changed' : ''));
        var ta = document.createElement('textarea');
        ta.value = cur;
        ta.rows = 1;
        ta.spellcheck = false;
        ta.dataset.key = it.key;
        ta.title = '原文：' + it.orig;
        var rs = make('button', 'cms-reset', '还原');
        rs.type = 'button';
        rs.dataset.key = it.key;
        row.appendChild(make('span', 'cms-tag', it.tag)); row.appendChild(ta); row.appendChild(rs);
        box.appendChild(row);
      });
      listEl.appendChild(box);
    });
    listEl.querySelectorAll('textarea').forEach(size);
    updateStatus();
  }

  function load(page) {
    current = page;
    selEl.value = page;
    openEl.href = (page === 'site' ? 'index' : page) + '.html';
    listEl.textContent = '读取中…';
    fetchPage(page)
      .then(function (doc) {
        var prefix = page + '.';
        items = [];
        doc.querySelectorAll('[data-cms]').forEach(function (el) {
          var key = el.getAttribute('data-cms');
          if (key.indexOf(prefix) !== 0) return;
          var orig = CMS.read(el);
          if ((key in origMap) && origMap[key] !== orig) { delete edits[key]; stale++; }
          origMap[key] = orig;
          items.push({ key: key, orig: orig, tag: el.tagName.toLowerCase(), group: labelOf(el) });
        });
        render();
      })
      .catch(function (err) { listEl.textContent = '读取失败：' + err.message; });
  }

  /* ---------------------------------------------------------------- images */
  function renderImgs() {
    imgGrid.textContent = '';
    if (!imgItems.length) { imgGrid.appendChild(make('p', 'img-empty', '这个页面没有固定位置的图片。')); updateImgStatus(); return; }
    var last = null;
    imgItems.forEach(function (it) {
      if (it.group !== last) { last = it.group; imgGrid.appendChild(make('h3', 'img-group', it.group)); }
      var cur = imgEdits[it.key] || it.orig, changed = cur !== it.orig;
      var card = make('figure', 'img-card' + (changed ? ' is-changed' : ''));
      var pic = make('div', 'img-card__pic'), im = document.createElement('img');
      im.src = abs(cur);
      im.alt = '';
      im.loading = 'lazy';
      pic.appendChild(im);
      var cap = make('figcaption');
      cap.appendChild(make('b', '', it.alt || it.orig.split('/').pop()));
      cap.appendChild(make('small', '', (changed ? '已替换 · ' : '') + cur.split('/').pop()));
      var acts = make('div', 'img-card__acts'), rb = make('button', 'btn btn--ghost btn--sm', '替换');
      rb.type = 'button';
      rb.dataset.act = 'replace';
      rb.dataset.key = it.key;
      acts.appendChild(rb);
      if (changed) {
        var xb = make('button', 'cms-reset', '还原');
        xb.type = 'button';
        xb.dataset.act = 'reset';
        xb.dataset.key = it.key;
        acts.appendChild(xb);
      }
      card.appendChild(pic); card.appendChild(cap); card.appendChild(acts);
      imgGrid.appendChild(card);
    });
    updateImgStatus();
  }

  function loadImgs(page) {
    imgSel.value = page;
    imgGrid.textContent = '读取中…';
    fetchPage(page)
      .then(function (doc) {
        var prefix = page + '.';
        imgItems = [];
        doc.querySelectorAll('[data-cms-img]').forEach(function (el) {
          var key = el.getAttribute('data-cms-img');
          if (key.indexOf(prefix) !== 0) return;
          var orig = el.getAttribute('src') || '';
          if ((key in imgOrig) && imgOrig[key] !== orig) delete imgEdits[key];
          imgOrig[key] = orig;
          imgItems.push({ key: key, orig: orig, alt: el.getAttribute('alt') || '', group: labelOf(el) });
        });
        renderImgs();
      })
      .catch(function (err) { imgGrid.textContent = '读取失败：' + err.message; });
  }

  /* ---------------------------------------------------------------- save (text and images share one file) */
  function persist() {
    var entries = {}, images = {};
    Object.keys(edits).forEach(function (k) {
      if (origMap[k] != null && origMap[k] !== edits[k]) entries[k] = { o: origMap[k], t: edits[k] };
    });
    Object.keys(imgEdits).forEach(function (k) {
      if (imgOrig[k] && imgOrig[k] !== imgEdits[k]) images[k] = { o: imgOrig[k], t: imgEdits[k] };
    });
    return fetch('/api/content', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: entries, images: images }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || '保存失败');
        edits = {};
        Object.keys(entries).forEach(function (k) { edits[k] = entries[k].t; });
        imgEdits = {};
        Object.keys(images).forEach(function (k) { imgEdits[k] = images[k].t; });
        stale = 0;
        return res;
      });
  }
  function save(btn, st) {
    btn.disabled = true;
    st.textContent = '保存中…';
    persist()
      .then(function (res) {
        setDirty(false);
        setImgDirty(false);
        st.textContent = '已保存 ' + res.count + ' 处文字、' + (res.images || 0) + ' 张图片 · 刷新网站即可看到';
      })
      .catch(function (err) { st.textContent = '保存失败：' + err.message; })
      .then(function () { btn.disabled = false; });
  }

  function start() {
    if (started) return;
    started = true;
    PAGES.forEach(function (p) {
      [selEl, imgSel].forEach(function (s) {
        var o = document.createElement('option');
        o.value = p[0];
        o.textContent = p[1];
        s.appendChild(o);
      });
    });
    fetch('assets/data/content.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var saved = (d && d.entries) || {}, si = (d && d.images) || {};
        Object.keys(saved).forEach(function (k) { origMap[k] = saved[k].o; edits[k] = saved[k].t; });
        Object.keys(si).forEach(function (k) { imgOrig[k] = si[k].o; imgEdits[k] = si[k].t; });
        load(current);
        loadImgs('index');
      });
  }

  listEl.addEventListener('input', function (e) {
    var ta = e.target;
    if (ta.tagName !== 'TEXTAREA') return;
    var it = find(ta.dataset.key);
    if (!it) return;
    var v = ta.value.split(CR).join('');
    if (v === it.orig) delete edits[it.key]; else edits[it.key] = v;
    ta.closest('.cms-row').classList.toggle('is-changed', v !== it.orig);
    size(ta);
    setDirty(true);
  });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('.cms-reset');
    if (!b) return;
    delete edits[b.dataset.key];
    render();
    setDirty(true);
  });
  selEl.addEventListener('change', function () { load(selEl.value); });
  searchEl.addEventListener('input', render);
  changedEl.addEventListener('change', render);
  saveBtn.addEventListener('click', function () { save(saveBtn, statusEl); });

  imgSel.addEventListener('change', function () { loadImgs(imgSel.value); });
  imgGrid.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'reset') {
      delete imgEdits[b.dataset.key];
      setImgDirty(true);
      renderImgs();
      return;
    }
    pending = b.dataset.key;
    imgFile.value = '';
    imgFile.click();
  });
  imgFile.addEventListener('change', function () {
    var f = imgFile.files[0], key = pending;
    if (!f || !key) return;
    var fd = new FormData();
    fd.append('target', 'site');
    fd.append('file', f, f.name);
    imgStatus.textContent = '上传中…';
    fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var file = res.ok && res.files && res.files[0] && res.files[0].file;
        if (!file) throw new Error((res.errors && res.errors[0]) || res.error || '上传失败');
        imgEdits[key] = file;
        setImgDirty(true);
        renderImgs();
      })
      .catch(function (err) { imgStatus.textContent = '上传失败：' + err.message; });
  });
  imgSave.addEventListener('click', function () { save(imgSave, imgStatus); });
  window.addEventListener('beforeunload', function (e) { if (dirty || imgDirty) { e.preventDefault(); e.returnValue = ''; } });

  if (!app.hidden) start();
  else new MutationObserver(function () { if (!app.hidden) start(); }).observe(app, { attributes: true, attributeFilter: ['hidden'] });
})();
