/* Admin: edit all site text. Reads each page's HTML, lists data-cms elements, saves overrides to /api/content. */
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
  var edits = {}, origMap = {}, items = [], dirty = false, stale = 0, started = false, current = 'index';

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

  function updateStatus() {
    var n = Object.keys(edits).length;
    countEl.textContent = n;
    statusEl.classList.toggle('is-dirty', dirty);
    if (dirty) statusEl.textContent = '有未保存的修改（共 ' + n + ' 处）';
    else if (stale) statusEl.textContent = '共 ' + n + ' 处修改 · ' + stale + ' 条旧修改因页面改版已失效并忽略';
    else statusEl.textContent = '共 ' + n + ' 处修改';
  }
  function setDirty(v) { dirty = v; updateStatus(); }

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
      var box = document.createElement('div');
      box.className = 'cms-group';
      var head = document.createElement('h3');
      head.textContent = g + '  ·  ' + groups[g].length;
      box.appendChild(head);
      groups[g].forEach(function (it) {
        var cur = curText(it);
        var row = document.createElement('div');
        row.className = 'cms-row' + (cur !== it.orig ? ' is-changed' : '');
        var tg = document.createElement('span');
        tg.className = 'cms-tag';
        tg.textContent = it.tag;
        var ta = document.createElement('textarea');
        ta.value = cur;
        ta.rows = 1;
        ta.spellcheck = false;
        ta.dataset.key = it.key;
        ta.title = '原文：' + it.orig;
        var rs = document.createElement('button');
        rs.type = 'button';
        rs.className = 'cms-reset';
        rs.dataset.key = it.key;
        rs.textContent = '还原';
        row.appendChild(tg); row.appendChild(ta); row.appendChild(rs);
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
    fetch((page === 'site' ? 'about' : page) + '.html', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
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

  function start() {
    if (started) return;
    started = true;
    PAGES.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p[0];
      o.textContent = p[1];
      selEl.appendChild(o);
    });
    fetch('assets/data/content.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var saved = (d && d.entries) || {};
        Object.keys(saved).forEach(function (k) { origMap[k] = saved[k].o; edits[k] = saved[k].t; });
        load(current);
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
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  saveBtn.addEventListener('click', function () {
    var entries = {};
    Object.keys(edits).forEach(function (k) {
      if (origMap[k] != null && origMap[k] !== edits[k]) entries[k] = { o: origMap[k], t: edits[k] };
    });
    saveBtn.disabled = true;
    statusEl.textContent = '保存中…';
    fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: entries }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || '保存失败');
        edits = {};
        Object.keys(entries).forEach(function (k) { edits[k] = entries[k].t; });
        stale = 0;
        setDirty(false);
        statusEl.textContent = '已保存 ' + res.count + ' 处 · 刷新网站即可看到';
      })
      .catch(function (err) { statusEl.textContent = '保存失败：' + err.message; })
      .then(function () { saveBtn.disabled = false; });
  });

  if (!app.hidden) start();
  else new MutationObserver(function () { if (!app.hidden) start(); }).observe(app, { attributes: true, attributeFilter: ['hidden'] });
})();
