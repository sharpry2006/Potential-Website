/* POTENTIAL vortex: stars spiral into a black-hole core and condense into the team mark. Themed by --fx; paused off-screen; static under reduced motion. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hosts = document.querySelectorAll('.quote-band, .join-panel');
  if (!hosts.length) return;
  var img = new Image(), pts = [];
  function go() { Array.prototype.forEach.call(hosts, init); }
  img.onload = function () { sample(); go(); };
  img.onerror = go;
  img.src = 'assets/img/logo-mark.png';

  function sample() {
    try {
      var W = 96, H = Math.round(96 * img.naturalHeight / img.naturalWidth);
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var x = c.getContext('2d');
      x.drawImage(img, 0, 0, W, H);
      var d = x.getImageData(0, 0, W, H).data;
      for (var j = 0; j < H; j += 2) for (var i = 0; i < W; i += 2) {
        if (d[(j * W + i) * 4 + 3] > 128) pts.push([i / W - 0.5, (j / H - 0.5) * H / W]);
      }
    } catch (e) { pts = []; }
  }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  /* 16s cycle: 0-6s stars fall in, 6-10s logo holds, 10-15s disperse */
  function prog(s) { var u = s % 16; return u < 6 ? sm(u / 6) : u < 10 ? 1 : u < 15 ? 1 - sm((u - 10) / 5) : 0; }

  function init(host) {
    var cv = document.createElement('canvas');
    cv.className = 'vortex';
    cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, host.firstChild);
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, narrow = window.innerWidth < 760;
    var fx = (getComputedStyle(document.body).getPropertyValue('--fx') || '255,61,46').trim();
    var N = Math.min(pts.length || 240, narrow ? 170 : 420), ps = [];
    for (var k = 0; k < N; k++) {
      var t = pts.length ? pts[Math.floor(k * pts.length / N)] : [Math.cos(k) * 0.3, Math.sin(k) * 0.3];
      ps.push({ a: Math.random() * 6.283, r: 0.3 + Math.random() * 0.8, tx: t[0], ty: t[1], s: 0.7 + Math.random() * 1.1, q: Math.random() });
    }
    function size() {
      w = host.clientWidth; h = host.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    }
    function draw(ms) {
      var s = ms / 1000 + (window.__vxOffset || 0);
      var p = reduced ? 1 : prog(s), wg = p * p * p;
      var cx = w * (narrow ? 0.5 : 0.8), cy = h * 0.5;
      var R = narrow ? Math.min(h * 0.5, w * 0.4) : Math.min(h * 0.62, w * 0.26);
      var span = Math.max(w, h) * 0.55;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35 + s * 0.02);
      for (var m = 0; m < 3; m++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, R * (0.6 + m * 0.18), R * (0.17 + m * 0.06), 0, 0, 6.283);
        ctx.strokeStyle = 'rgba(' + fx + ',' + (0.3 * (1 - 0.8 * p) / (m + 1)).toFixed(3) + ')';
        ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.7);
      g.addColorStop(0, 'rgba(5,6,8,' + (0.75 * (1 - p)).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(5,6,8,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (var i = 0; i < ps.length; i++) {
        var o = ps[i];
        var ang = o.a + (1 - p) * (3 + o.r * 5) + s * 0.04 * o.s;
        var rad = o.r * span * Math.pow(1 - p, 1.4);
        var x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.62;
        x = x * (1 - wg) + (cx + o.tx * R) * wg + Math.sin(s * 1.4 + o.q * 30) * 0.5 * wg;
        y = y * (1 - wg) + (cy + o.ty * R) * wg;
        var a = (0.28 + 0.5 * wg) * (0.7 + 0.3 * Math.sin(s * 2.4 + o.q * 20));
        ctx.fillStyle = o.q < 0.18 ? 'rgba(255,255,255,' + a.toFixed(3) + ')' : 'rgba(' + fx + ',' + a.toFixed(3) + ')';
        var z = o.s * (0.9 + 0.5 * wg);
        ctx.fillRect(x - z / 2, y - z / 2, z, z);
      }
    }
    var raf = 0, on = false;
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    if (reduced) return;
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !on) { on = true; raf = requestAnimationFrame(loop); }
      else if (!v && on) { on = false; cancelAnimationFrame(raf); }
    }).observe(host);
  }
})();
