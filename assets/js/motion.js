/* POTENTIAL motion layer: page theme class, scan beams, timeline nodes, pointer spotlight, parallax, hall counters. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var hero = document.querySelector('.page-hero');
  var MAP = { Team: 'about', Machine: 'robots', Results: 'results', Honours: 'hall', Join: 'join', Gallery: 'gallery' };

  if (hero) {
    var key = MAP[hero.getAttribute('data-watermark')];
    if (key) body.classList.add('pg-' + key);
  } else if (document.getElementById('hero')) {
    body.classList.add('pg-home');
  }

  function beam(host) {
    if (!host) return;
    var s = document.createElement('span');
    s.className = 'scanbeam';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<b></b><b></b><b></b><b></b>';
    host.appendChild(s);
  }
  beam(hero);
  beam(document.getElementById('heroMedia'));

  document.querySelectorAll('.tl-item').forEach(function (it) {
    var n = document.createElement('i');
    n.className = 'tl-node';
    n.setAttribute('aria-hidden', 'true');
    it.appendChild(n);
  });

  ['.spec-list', '.join-steps'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty('--i', i); });
    });
  });

  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.feature,.step');
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--fx-x', (e.clientX - r.left) + 'px');
      t.style.setProperty('--fx-y', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  if (hero && !reduced) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < 900) hero.style.setProperty('--py', (y * 0.14).toFixed(1));
        ticking = false;
      });
    }, { passive: true });
  }

  var stats = document.getElementById('hallStats');
  if (stats && !reduced) {
    new MutationObserver(function () {
      stats.querySelectorAll('b').forEach(function (b) {
        if (b.getAttribute('data-done') || !b.firstChild) return;
        b.setAttribute('data-done', '1');
        var n = parseInt(b.firstChild.nodeValue, 10);
        if (isNaN(n)) return;
        var t0 = null;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1100);
          b.firstChild.nodeValue = String(Math.round(n * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }).observe(stats, { childList: true });
  }
})();
