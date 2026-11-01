/* POTENTIAL / Endurance: the ring ship from Interstellar drifting beside Gargantua (2D canvas above the scrim). Hall page only. */
(function () {
  'use strict';
  if (!document.body.classList.contains('pg-hall')) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__gT != null;
  var cv = document.createElement('canvas');
  cv.className = 'endurance';
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:44vw;top:6vh;z-index:-1;pointer-events:none';
  var x = cv.getContext('2d');
  if (!x) return;
  var N = 12, LIT = [1, 4, 7, 10], TAU = Math.PI * 2, mx = 0, my = 0, tx = 0, ty = 0, last = 0;
  var s = document.querySelector('.gargantua-scrim');
  if (s) s.parentNode.insertBefore(cv, s.nextSibling); else document.body.insertBefore(cv, document.body.firstChild);

  function size() {
    var S = Math.round(Math.min(280, Math.max(160, window.innerHeight * 0.26))), d = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.display = window.innerWidth < 760 ? 'none' : '';
    cv.width = cv.height = Math.round(S * d);
    cv.style.width = cv.style.height = S + 'px';
    if (still) draw(14);
  }
  // one habitat module, lit warm from the accretion disk at the lower right
  function mod(p, m, ct) {
    var lit = Math.max(0, Math.cos(p.a) * 0.75 + Math.sin(p.a) * 0.66), v = Math.round(55 + 125 * lit);
    var w = m * 1.35, h = m * (0.55 + 0.45 * ct);
    x.save();
    x.translate(p.x, p.y);
    x.rotate(Math.atan2(Math.cos(p.a) * ct, -Math.sin(p.a)));
    x.fillStyle = 'rgb(' + (v + 28) + ',' + (v + 14) + ',' + v + ')';
    x.fillRect(-w / 2, -h / 2, w, h);
    x.fillStyle = 'rgba(14,14,18,.85)';
    x.fillRect(-w * 0.32, -h * 0.2, w * 0.64, h * 0.32);
    x.fillStyle = 'rgba(255,215,160,' + (0.55 * lit).toFixed(2) + ')';
    x.fillRect(-w / 2, h / 2 - h * 0.14, w, h * 0.14);
    x.strokeStyle = 'rgba(0,0,0,.55)';
    x.lineWidth = m * 0.05;
    x.strokeRect(-w / 2, -h / 2, w, h);
    x.restore();
  }
  function draw(t) {
    var u = cv.width, R = u * 0.3, m = u * 0.07, tilt = 0.45, ct = Math.cos(tilt), spin = t * 0.22, i;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, u, u);
    x.translate(u * (0.5 + mx * 0.03), u * (0.5 + my * 0.03));
    x.rotate(-0.45 + Math.sin(t * 0.07) * 0.05);
    var mods = [];
    for (i = 0; i < N; i++) {
      var a = spin + i / N * TAU;
      mods.push({ a: a, x: Math.cos(a) * R, y: Math.sin(a) * R * ct, z: Math.sin(a) });
    }
    mods.forEach(function (p) { if (p.z < 0) mod(p, m, ct); });
    x.strokeStyle = 'rgba(120,116,110,.9)';
    x.lineWidth = u * 0.014;
    x.beginPath(); x.ellipse(0, 0, R, R * ct, 0, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(255,200,140,.35)';
    x.lineWidth = u * 0.006;
    x.beginPath(); x.ellipse(0, 0, R, R * ct, 0, -0.3, 1.6); x.stroke();
    x.strokeStyle = 'rgba(105,100,95,.85)';
    x.lineWidth = u * 0.008;
    for (i = 0; i < 4; i++) {
      var b = spin + i * TAU / 4 + 0.26;
      x.beginPath();
      x.moveTo(Math.cos(b) * R * 0.16, Math.sin(b) * R * 0.16 * ct);
      x.lineTo(Math.cos(b) * R, Math.sin(b) * R * ct);
      x.stroke();
    }
    var hg = x.createRadialGradient(R * 0.05, R * 0.05, 0, 0, 0, R * 0.17);
    hg.addColorStop(0, 'rgb(170,160,150)');
    hg.addColorStop(1, 'rgb(45,43,42)');
    x.fillStyle = hg;
    x.beginPath(); x.ellipse(0, 0, R * 0.17, R * 0.17 * ct, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgb(25,25,27)';
    x.beginPath(); x.ellipse(0, 0, R * 0.07, R * 0.07 * ct, 0, 0, TAU); x.fill();
    mods.forEach(function (p) { if (p.z >= 0) mod(p, m, ct); });
    // blue thruster / window glow
    x.globalCompositeOperation = 'lighter';
    LIT.forEach(function (k) {
      var p = mods[k], f = (0.8 + 0.2 * Math.sin(t * 5 + k * 1.7)).toFixed(2);
      var gx = Math.cos(p.a) * (R + m * 0.75), gy = Math.sin(p.a) * (R + m * 0.75) * ct;
      var g = x.createRadialGradient(gx, gy, 0, gx, gy, m * 1.3);
      g.addColorStop(0, 'rgba(220,240,255,' + f + ')');
      g.addColorStop(0.25, 'rgba(110,170,255,' + (0.7 * f).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(40,90,255,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(gx, gy, m * 1.3, 0, TAU); x.fill();
    });
    x.globalCompositeOperation = 'source-over';
    // small dark planet between the ship and the disk, rim-lit from the right (as in the film still)
    x.setTransform(1, 0, 0, 1, 0, 0);
    var px = u * 0.93, py = u * 0.62, pr = u * 0.04, pg = x.createRadialGradient(px + pr * 0.5, py, pr * 0.2, px, py, pr);
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
