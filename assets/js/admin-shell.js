/* Admin shell: sidebar navigation that shows one group of panels at a time (remembered in the URL hash). */
(function () {
  'use strict';
  var wrap = document.querySelector('.admin-wrap'), nav = document.getElementById('adminNav');
  if (!wrap || !nav) return;
  var panels = Array.prototype.filter.call(wrap.children, function (s) { return s.dataset && s.dataset.nav; });
  var groups = [];
  panels.forEach(function (s) {
    var id = s.dataset.navId;
    if (groups.indexOf(id) >= 0) return;
    groups.push(id);
    var a = document.createElement('a'), i = document.createElement('i');
    a.href = '#' + id;
    a.dataset.id = id;
    i.setAttribute('aria-hidden', 'true');
    i.textContent = (groups.length < 10 ? '0' : '') + groups.length;
    a.appendChild(i);
    a.appendChild(document.createTextNode(s.dataset.nav));
    nav.appendChild(a);
  });
  function show() {
    var id = location.hash.slice(1);
    if (groups.indexOf(id) < 0) id = groups[0];
    panels.forEach(function (s) { s.hidden = s.dataset.navId !== id; });
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('is-active', a.dataset.id === id); });
  }
  window.addEventListener('hashchange', function () { show(); window.scrollTo(0, 0); });
  show();
})();
