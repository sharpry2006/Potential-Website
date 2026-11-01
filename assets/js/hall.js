/* ==========================================================================
   名人堂 —— 荣誉墙 + 成员档案（读取 assets/data/honors.json）
   ========================================================================== */
(function () {
  'use strict';

  var DATA_URL = 'assets/data/honors.json';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init() {
    var page = document.getElementById('trophyList');
    if (!page) return;

    fetch(DATA_URL, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        var honors = ((data && data.honors) || []).filter(function (h) { return h.visible !== false; });
        var members = ((data && data.members) || []).filter(function (m) { return m.visible !== false; });
        renderHonors(honors);
        renderMembers(members);
        renderStats(honors, members);
      });
  }

  /* ------------------------------------------------------------ 顶部数据 */
  function renderStats(honors, members) {
    var host = document.getElementById('hallStats');
    if (!host) return;
    var seasons = {};
    honors.forEach(function (h) { if (h.year) seasons[h.year] = true; });
    var seasonCount = Object.keys(seasons).length;
    var podium = honors.filter(function (h) {
      return /季军|亚军|冠军|一等奖|金奖/.test(h.result || '');
    }).length;

    var items = [
      { n: honors.length, unit: '项', label: 'Honours' },
      { n: seasonCount, unit: '个赛季', label: 'Seasons' },
      { n: podium, unit: '次', label: 'Podium' }
    ];
    if (members.length) items.push({ n: members.length, unit: '位', label: 'Members' });

    host.innerHTML = items.map(function (it) {
      return '<div class="hall-stat"><b>' + it.n + '<i>' + it.unit + '</i></b>'
        + '<span>' + it.label + '</span></div>';
    }).join('');
  }

  function levelLabel(level) {
    var map = { national: 'National', regional: 'Regional', team: 'Milestone', school: 'Campus' };
    return map[level] || 'Honour';
  }

  /* ------------------------------------------------------------ 荣誉墙 */
  function renderHonors(list) {
    var host = document.getElementById('trophyList');
    var empty = document.getElementById('honourEmpty');
    if (!list.length) {
      host.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    // 顺序由后台的「排序值」决定（可拖动调整），日期只作兜底
    list.sort(function (a, b) {
      var oa = a.order || 0;
      var ob = b.order || 0;
      if (oa !== ob) return oa - ob;
      var da = a.date || (a.year + '-00');
      var db = b.date || (b.year + '-00');
      return da < db ? 1 : da > db ? -1 : 0;
    });

    host.innerHTML = list.map(function (h, i) {
      var strong = /季军|亚军|冠军|一等奖|金奖/.test(h.result || '');
      return ''
        + '<article class="trophy" data-reveal data-reveal-delay="' + (i * 60) + '">'
        + '  <div class="trophy__year">' + esc(h.year || '—')
        + '    <small>' + esc(h.season || h.level === 'regional' ? 'Regional' : '') + '</small>'
        + '  </div>'
        + '  <div class="trophy__main">'
        + '    <h3>' + esc(h.title) + '</h3>'
        + '    <span class="trophy__event">' + esc(h.event || '') + '</span>'
        + (h.note ? '<p class="trophy__note">' + esc(h.note) + '</p>' : '')
        + '  </div>'
        + '  <div class="trophy__side">'
        + (h.result ? '<span class="result-badge' + (strong ? '' : ' result-badge--soft') + '">' + esc(h.result) + '</span>' : '')
        + (h.date ? '<span class="trophy__meta">' + esc(h.date) + '</span>' : '')
        + '  </div>'
        + '</article>';
    }).join('');

    // 让新插入的元素参与滚动揭示
    host.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { el.classList.add('is-visible'); io.unobserve(el); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------ 成员档案 */
  function renderMembers(list) {
    var grid = document.getElementById('memberGrid');
    var emptyEl = document.getElementById('memberEmpty');
    var filtersEl = document.getElementById('memberFilters');
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = '';
      grid.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      if (filtersEl) filtersEl.hidden = true;
      return;
    }
    grid.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    var seasons = [];
    list.forEach(function (m) {
      var s = m.season || '其他';
      if (seasons.indexOf(s) < 0) seasons.push(s);
    });
    seasons.sort(function (a, b) { return String(b).localeCompare(String(a)); });

    var current = 'all';

    if (filtersEl && seasons.length > 1) {
      filtersEl.hidden = false;
      filtersEl.innerHTML = '<button type="button" data-season="all" class="is-active">全部<span style="opacity:.55;margin-left:6px">'
        + list.length + '</span></button>'
        + seasons.map(function (s) {
          var n = list.filter(function (m) { return (m.season || '其他') === s; }).length;
          return '<button type="button" data-season="' + esc(s) + '">' + esc(s)
            + '<span style="opacity:.55;margin-left:6px">' + n + '</span></button>';
        }).join('');
      filtersEl.onclick = function (e) {
        var btn = e.target.closest('button[data-season]');
        if (!btn) return;
        current = btn.dataset.season;
        filtersEl.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        paint();
      };
    }

    function paint() {
      var items = list.slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      }).filter(function (m) {
        return current === 'all' || (m.season || '其他') === current;
      });

      grid.innerHTML = items.map(function (m) {
        var initial = (m.name || '?').trim().slice(0, 1);
        var avatar = m.avatar
          ? '<img src="' + esc(m.avatar) + '" alt="' + esc(m.name) + '" loading="lazy" />'
          : initial;
        return ''
          + '<article class="member">'
          + '  <div class="member__top">'
          + '    <div class="member__avatar">' + avatar + '</div>'
          + '    <div class="member__id">'
          + '      <div class="member__name">' + esc(m.name) + '</div>'
          + (m.role ? '<div class="member__role">' + esc(m.role) + '</div>' : '')
          + '    </div>'
          + '  </div>'
          + (m.note ? '<p class="member__note">' + esc(m.note) + '</p>' : '')
          + '  <div class="member__meta">'
          + (m.direction ? '<span class="member__chip">' + esc(m.direction) + '</span>' : '')
          + (m.season ? '<span class="member__chip">' + esc(m.season) + '</span>' : '')
          + (m.nick ? '<span class="member__chip">' + esc(m.nick) + '</span>' : '')
          + '  </div>'
          + '</article>';
      }).join('');
    }

    paint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
