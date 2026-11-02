/* POTENTIAL / Endurance: the ring ship from Interstellar drifting beside Gargantua (2D canvas above the scrim). Hall page only.
   Flat-shaded 3D on a 2D canvas: 12 habitat modules joined by pressure tubes, four truss spokes, a central hub with the Ranger
   and Lander docked; warm key light from the accretion disk (lower right), cool sky fill, fine line-art edges, lit windows, RCS glow. */
(function () {
  'use strict';
  if (!document.body.classList.contains('pg-hall')) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__gT != null;
  var cv = document.createElement('canvas');
  cv.className = 'endurance';
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:50vw;top:7vh;z-index:-1;pointer-events:none';
  var x = cv.getContext('2d');
  if (!x) return;
  var N = 12, LIT = [1, 4, 7, 10], TAU = Math.PI * 2, M = 0.2, mx = 0, my = 0, tx = 0, ty = 0, last = 0;
  var KEY = nrm([0.62, -0.42, 0.66]), FILL = nrm([-0.55, 0.62, 0.5]), HV = nrm([0.62, -0.42, 1.66]);
  var WARM = [1, 0.8, 0.56], COOL = [0.5, 0.64, 1];
  var GEO = build();
  var s = document.querySelector('.gargantua-scrim');
  if (s) s.parentNode.insertBefore(cv, s.nextSibling); else document.body.insertBefore(cv, document.body.firstChild);

  function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function add(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }
  function sc(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function bil(p, a, b) {
    var u0 = [p[0][0] + (p[1][0] - p[0][0]) * a, p[0][1] + (p[1][1] - p[0][1]) * a], u1 = [p[3][0] + (p[2][0] - p[3][0]) * a, p[3][1] + (p[2][1] - p[3][1]) * a];
    return [u0[0] + (u1[0] - u0[0]) * b, u0[1] + (u1[1] - u0[1]) * b];
  }

  // ship geometry in ring radii: a flat list of convex faces with their world-space outward normal
  function build() {
    var F = [], Y = [0, 1, 0], i;
    function face(p, n, col, win) { F.push({ p: p, n: n, col: col, win: win }); }
    // box from a centre and three half-extent vectors (tangent, up, radial); the outer radial face can carry a window strip
    function box(c, at, ay, ar, col, win) {
      [[ar, at, ay], [at, ay, ar], [ay, ar, at]].forEach(function (b) {
        [1, -1].forEach(function (g) {
          var o = add(c, b[0], g);
          face([add(add(o, b[1], 1), b[2], 1), add(add(o, b[1], -1), b[2], 1), add(add(o, b[1], -1), b[2], -1), add(add(o, b[1], 1), b[2], -1)],
            nrm(sc(b[0], g)), col, win && b[0] === ar && g > 0);
        });
      });
    }
    function cyl(c, rad, hh, n, col) {
      var top = [], bot = [], k;
      for (k = 0; k < n; k++) {
        var q = k / n * TAU;
        top.push(add(c, [Math.cos(q) * rad, hh, Math.sin(q) * rad], 1));
        bot.push(add(c, [Math.cos(q) * rad, -hh, Math.sin(q) * rad], 1));
      }
      for (k = 0; k < n; k++) {
        var j = (k + 1) % n, qm = (k + 0.5) / n * TAU;
        face([top[k], top[j], bot[j], bot[k]], [Math.cos(qm), 0, Math.sin(qm)], col, false);
      }
      face(top, Y, col, false);
      face(bot.slice().reverse(), [0, -1, 0], col, false);
    }
    for (i = 0; i < N; i++) {
      var a = i / N * TAU, r = [Math.cos(a), 0, Math.sin(a)], t = [-Math.sin(a), 0, Math.cos(a)], big = i % 3 !== 2;
      box(r, sc(t, M * (big ? 0.62 : 0.5)), sc(Y, M * (big ? 0.4 : 0.3)), sc(r, M * 0.36), big ? [0.76, 0.74, 0.7] : [0.62, 0.62, 0.63], true);
      if (!big) {  // radiator fins on the smaller service modules
        box(add(r, Y, M * 0.4), sc(t, M * 0.42), sc(Y, M * 0.1), sc(r, M * 0.03), [0.45, 0.47, 0.5], false);
        box(add(r, Y, -M * 0.4), sc(t, M * 0.42), sc(Y, M * 0.1), sc(r, M * 0.03), [0.45, 0.47, 0.5], false);
      }
      var b = (i + 0.5) / N * TAU, rb = [Math.cos(b), 0, Math.sin(b)], tb = [-Math.sin(b), 0, Math.cos(b)];
      box(sc(rb, Math.cos(Math.PI / N)), sc(tb, Math.sin(Math.PI / N) - M * 0.45), sc(Y, M * 0.1), sc(rb, M * 0.1), [0.56, 0.55, 0.53], false);
      if (i % 3 === 0) {  // truss spoke: twin rails from the hub out to the ring
        [-1, 1].forEach(function (g) {
          box(add(sc(r, 0.56), Y, g * M * 0.09), sc(t, M * 0.05), sc(Y, M * 0.03), sc(r, 0.36), [0.5, 0.5, 0.5], false);
        });
      }
    }
    cyl([0, 0, 0], 0.19, M * 0.55, 12, [0.68, 0.66, 0.62]);
    cyl([0, M * 0.63, 0], 0.09, M * 0.08, 10, [0.42, 0.42, 0.44]);
    box([0, M * 0.83, 0], [0.17, 0, 0], [0, M * 0.08, 0], [0, 0, 0.07], [0.84, 0.82, 0.78], false);  // Ranger
    box([0.2, M * 0.83, 0], [0.04, 0, 0], [0, M * 0.05, 0], [0, 0, 0.045], [0.7, 0.68, 0.64], false);  // Ranger nose
    cyl([0, -M * 0.63, 0], 0.09, M * 0.08, 10, [0.42, 0.42, 0.44]);
    box([0, -M * 0.85, 0], [0.1, 0, 0], [0, M * 0.1, 0], [0, 0, 0.1], [0.72, 0.7, 0.66], false);  // Lander
    return F;
  }

  function shade(F, n) {
    var d1 = Math.max(0, dot(n, KEY)), d2 = Math.max(0, dot(n, FILL)), sp = Math.pow(Math.max(0, dot(n, HV)), 28), c = F.col, o = [], k;
    for (k = 0; k < 3; k++) o.push(Math.round(255 * (1 - Math.exp(-1.7 * (c[k] * (0.07 + 1.05 * d1 * WARM[k] + 0.3 * d2 * COOL[k]) + 0.7 * sp * WARM[k])))));
    return { c: 'rgb(' + o.join(',') + ')', e: 0.07 + 0.38 * d1 + 0.5 * sp };
  }

  function size() {
    var W = window.innerWidth, H = window.innerHeight, d = Math.min(window.devicePixelRatio || 1, 2), tr = W * 0.4;
    var hero = document.querySelector('.page-hero, .hero');
    if (hero) hero.querySelectorAll('h1, p').forEach(function (el) {
      var g = document.createRange();
      g.selectNodeContents(el);
      var b = g.getBoundingClientRect();
      if (b.width) tr = Math.max(tr, b.right);
    });
    // keep the ship clear of the hero text: it sits in the free area to the right, sized by viewport height
    var left = Math.max(tr + 12, W * 0.42), S = Math.round(Math.min(400, Math.max(200, H * 0.4), W * 0.98 - left));
    cv.style.display = W < 760 ? 'none' : '';
    cv.style.left = Math.round(left) + 'px';
    cv.style.top = Math.round(Math.max(64, H * 0.07)) + 'px';
    cv.width = cv.height = Math.round(S * d);
    cv.style.width = cv.style.height = S + 'px';
    if (still) draw(14);
  }
  function draw(t) {
    var u = cv.width, R = u * 0.36, spin = t * 0.16, tilt = 1.02 + my * 0.12, roll = -0.42 + Math.sin(t * 0.07) * 0.04 + mx * 0.08;
    var cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
    // ring spin about Y, tilt about X, roll about Z -> view space (x right, y up, z towards the viewer)
    function rot(v) {
      var X = v[0] * cs - v[2] * ss, Z = v[0] * ss + v[2] * cs, Y2 = v[1] * ct - Z * st, Z2 = v[1] * st + Z * ct;
      return [X * cr - Y2 * sr, X * sr + Y2 * cr, Z2];
    }
    function proj(w) { var f = 5 / (5 - w[2]); return [w[0] * f * R, -w[1] * f * R]; }
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, u, u);
    x.translate(u * (0.5 + mx * 0.03), u * (0.5 + my * 0.03));
    var halo = x.createRadialGradient(R * 0.3, R * 0.25, 0, 0, 0, R * 1.3);
    halo.addColorStop(0, 'rgba(255,170,90,.07)');
    halo.addColorStop(1, 'rgba(255,170,90,0)');
    x.fillStyle = halo;
    x.beginPath(); x.arc(0, 0, R * 1.3, 0, TAU); x.fill();
    // painter's order over the visible faces
    var L = [];
    GEO.forEach(function (F) {
      var n = rot(F.n);
      if (n[2] <= 0.005) return;
      var z = 0, p = F.p.map(function (v) { var w = rot(v); z += w[2]; return proj(w); });
      L.push({ p: p, z: z / p.length, n: n, F: F });
    });
    L.sort(function (a, b) { return a.z - b.z; });
    x.lineJoin = 'round';
    x.lineWidth = Math.max(0.6, u * 0.0016);
    L.forEach(function (q) {
      var h = shade(q.F, q.n), p = q.p, k;
      x.beginPath();
      x.moveTo(p[0][0], p[0][1]);
      for (k = 1; k < p.length; k++) x.lineTo(p[k][0], p[k][1]);
      x.closePath();
      x.fillStyle = h.c;
      x.fill();
      x.strokeStyle = 'rgba(255,226,190,' + Math.min(0.75, h.e).toFixed(3) + ')';
      x.stroke();
      if (q.F.win) {
        var fl = 0.75 + 0.25 * Math.sin(t * 2.3 + q.z * 9), al = (0.35 + 0.55 * q.n[2]) * fl;
        x.fillStyle = 'rgba(255,208,150,' + al.toFixed(3) + ')';
        x.beginPath();
        [[0.14, 0.42], [0.86, 0.42], [0.86, 0.58], [0.14, 0.58]].forEach(function (c, j) {
          var w = bil(p, c[0], c[1]);
          if (j) x.lineTo(w[0], w[1]); else x.moveTo(w[0], w[1]);
        });
        x.fill();
      }
    });
    // blue RCS glow on four modules, dimmed when on the far side
    x.globalCompositeOperation = 'lighter';
    LIT.forEach(function (k) {
      var a = k / N * TAU, w = rot([Math.cos(a) * (1 + M * 0.5), 0, Math.sin(a) * (1 + M * 0.5)]), g2 = proj(w);
      var f = (0.7 + 0.3 * Math.sin(t * 5 + k * 1.7)) * (w[2] > 0 ? 1 : 0.3), rr = u * 0.045;
      var g = x.createRadialGradient(g2[0], g2[1], 0, g2[0], g2[1], rr);
      g.addColorStop(0, 'rgba(220,240,255,' + (0.9 * f).toFixed(2) + ')');
      g.addColorStop(0.3, 'rgba(110,170,255,' + (0.5 * f).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(40,90,255,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(g2[0], g2[1], rr, 0, TAU); x.fill();
    });
    x.globalCompositeOperation = 'source-over';
    // small dark planet between the ship and the disk, rim-lit from the right (as in the film still)
    x.setTransform(1, 0, 0, 1, 0, 0);
    var px = u * 0.93, py = u * 0.86, pr = u * 0.035, pg = x.createRadialGradient(px + pr * 0.5, py, pr * 0.2, px, py, pr);
    pg.addColorStop(0, 'rgb(70,62,55)');
    pg.addColorStop(0.7, 'rgb(22,20,20)');
    pg.addColorStop(1, 'rgb(8,8,10)');
    x.fillStyle = pg;
    x.beginPath(); x.arc(px, py, pr, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,200,140,.55)';
    x.lineWidth = u * 0.004;
    x.beginPath(); x.arc(px, py, pr, -1.2, 1.2); x.stroke();
  }
  function fade() { cv.style.opacity = Math.max(0.3, 1 - window.scrollY / (window.innerHeight * 0.9)).toFixed(2); }
  window.addEventListener('resize', size);
  window.addEventListener('scroll', fade, { passive: true });
  if (document.fonts) document.fonts.ready.then(size);
  size();
  fade();
  if (still) return;
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  function loop(ms) {
    requestAnimationFrame(loop);
    if (ms - last < 33) return;
    last = ms;
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    draw(ms / 1000);
  }
  requestAnimationFrame(loop);
})();
