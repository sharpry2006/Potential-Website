/* ==========================================================================
   POTENTIAL — site behaviour
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- header */
  var header = document.querySelector('.site-header');
  var scrollBar = document.querySelector('.scroll-bar');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 24);
    if (scrollBar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, y / h) : 0;
      scrollBar.style.transform = 'scaleX(' + p + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ mobile nav */
  var toggle = document.querySelector('.nav__toggle');
  var drawer = document.querySelector('.nav__drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------- scroll reveal */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* --------------------------------------------------- card spotlight fx */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  /* --------------------------------------------------------- stat counters */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-decimals') || '0') | 0;
    if (reduced) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var start = performance.now();
    var dur = 1500;
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  } else {
    counters.forEach(animateCount);
  }

  /* ----------------------------------------------- blueprint draw lengths */
  document.querySelectorAll('.blueprint__svg .draw').forEach(function (path) {
    try {
      var len = Math.ceil(path.getTotalLength()) + 2;
      path.style.setProperty('--len', len);
    } catch (err) {
      /* non-path elements are skipped */
    }
  });

  /* -------------------------------------------------------- marquee clone */
  document.querySelectorAll('.ticker__track').forEach(function (track) {
    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (node) {
      track.appendChild(node.cloneNode(true));
    });
  });

  /* ------------------------------------------------------------- canvas fx */
  var canvas = document.getElementById('hero-canvas');
  function heroHasMedia() {
    var hero = document.querySelector('.hero');
    return !!(hero && hero.classList.contains('hero--media'));
  }
  if (canvas && !reduced && !heroHasMedia()) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var points = [];
    var pointer = { x: -9999, y: -9999 };
    var raf = 0;
    var visible = true;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      points = [];
      var gap = w < 720 ? 56 : 76;
      var cols = Math.ceil(w / gap) + 1;
      var rows = Math.ceil(h / gap) + 1;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          points.push({
            ox: i * gap,
            oy: j * gap,
            x: i * gap,
            y: j * gap,
            ph: Math.random() * Math.PI * 2,
            s: 0.6 + Math.random() * 0.9
          });
        }
      }
    }

    function frame(t) {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      var time = t * 0.00035;

      // nodes
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var dx = pointer.x - p.ox;
        var dy = pointer.y - p.oy;
        var dist = Math.hypot(dx, dy);
        var push = dist < 190 ? (1 - dist / 190) * 16 : 0;
        var ang = Math.atan2(dy, dx);
        var tx = p.ox - Math.cos(ang) * push + Math.sin(time + p.ph) * 2.2;
        var ty = p.oy - Math.sin(ang) * push + Math.cos(time * 1.2 + p.ph) * 2.2;
        var alpha = 0.14 + (dist < 260 ? (1 - dist / 260) * 0.5 : 0);
        ctx.fillStyle = 'rgba(210,220,235,' + alpha.toFixed(3) + ')';
        ctx.fillRect(tx, ty, p.s, p.s);
      }

      // connections near pointer
      if (pointer.x > -1000) {
        for (var a = 0; a < points.length; a++) {
          var pa = points[a];
          for (var b = a + 1; b < points.length; b++) {
            var pb = points[b];
            var d = Math.hypot(pa.ox - pb.ox, pa.oy - pb.oy);
            if (d > 92) continue;
            var midx = (pa.ox + pb.ox) / 2;
            var midy = (pa.oy + pb.oy) / 2;
            var dm = Math.hypot(midx - pointer.x, midy - pointer.y);
            if (dm > 220) continue;
            ctx.strokeStyle = 'rgba(255,90,64,' + ((1 - dm / 220) * 0.22).toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(pa.ox, pa.oy);
            ctx.lineTo(pb.ox, pb.oy);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    });
    window.addEventListener('pointerleave', function () {
      pointer.x = -9999;
      pointer.y = -9999;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          if (visible && !raf) raf = requestAnimationFrame(frame);
        });
      }).observe(canvas);
    }
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------- section rail */
  (function sectionRail() {
    if (window.matchMedia('(max-width: 1200px)').matches) return;

    var sections = Array.prototype.slice.call(
      document.querySelectorAll('main section[id]')
    ).filter(function (sec) {
      return sec.offsetHeight > 240 && !sec.classList.contains('page-hero');
    });
    if (sections.length < 3) return;

    var labels = {};
    sections.forEach(function (sec) {
      var t = sec.querySelector('.h2, .h1');
      labels[sec.id] = t ? t.textContent.trim().replace(/\s+/g, '') : sec.id;
    });

    var rail = document.createElement('nav');
    rail.className = 'section-rail';
    rail.setAttribute('aria-label', '页面章节');
    rail.innerHTML = sections.map(function (sec, i) {
      return '<a href="#' + sec.id + '" data-target="' + sec.id + '">'
        + '<span>' + (labels[sec.id] || '').slice(0, 10) + '</span>'
        + '<i></i>'
        + '</a>';
    }).join('');
    document.body.appendChild(rail);

    var links = Array.prototype.slice.call(rail.querySelectorAll('a'));
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle('is-active', a.dataset.target === id); });
    }

    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActive(en.target.id);
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach(function (sec) { spy.observe(sec); });
    }

    function toggle() {
      var past = window.scrollY > window.innerHeight * 0.9;
      rail.classList.toggle('is-on', past);
    }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  })();

  /* ------------------------------------------------------ image fade-in */
  document.querySelectorAll('img[loading="lazy"], .media__thumb img').forEach(function (img) {
    if (img.complete && img.naturalWidth) { img.classList.add('is-loaded'); return; }
    img.addEventListener('load', function () { img.classList.add('is-loaded'); });
  });

  /* ------------------------------------------- 后端可用性探测（本地 vs 纯静态） */
  (function detectAdmin() {
    var body = document.body;
    if (!body) return;
    // 本地服务器有 /api/session；GitHub Pages 等纯静态托管会 404
    fetch('api/session', { cache: 'no-store' })
      .then(function (r) {
        body.classList.add(r.ok ? 'has-admin' : 'no-admin');
      })
      .catch(function () { body.classList.add('no-admin'); });
  })();

  /* ---------------------------------------------------------- footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
