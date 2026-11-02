/* POTENTIAL text overrides: applies assets/data/content.json to elements tagged with data-cms.
   An override is applied only when the current text still equals the recorded original (o), so a redesigned page never shows misplaced text. */
(function () {
  'use strict';
  var NL = String.fromCharCode(10);

  function read(el) {
    var raw = '';
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) raw += n.data.split(NL).join(' ');
      else if (n.nodeName === 'BR') raw += NL;
    }
    return raw.split(NL).map(function (l) { return l.split(' ').filter(Boolean).join(' '); }).join(NL).trim();
  }

  function write(el, text) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var ref = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeName === 'BR' || (n.nodeType === 3 && n.data.trim())) { ref = n; break; }
    }
    var frag = document.createDocumentFragment();
    text.split(NL).forEach(function (line, k) {
      if (k) frag.appendChild(document.createElement('br'));
      frag.appendChild(document.createTextNode(line));
    });
    if (ref) el.insertBefore(frag, ref); else el.appendChild(frag);
    nodes.forEach(function (n) { if (n.nodeName === 'BR' || n.nodeType === 3) el.removeChild(n); });
  }

  function apply(data) {
    var map = (data && data.entries) || {};
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var e = map[el.getAttribute('data-cms')];
      if (!e || typeof e.t !== 'string') return;
      if (read(el) === e.o) write(el, e.t);
    });
    var im = (data && data.images) || {};
    document.querySelectorAll('[data-cms-img]').forEach(function (el) {
      var e = im[el.getAttribute('data-cms-img')];
      if (!e || el.getAttribute('src') !== e.o) return;
      el.removeAttribute('srcset');
      el.src = e.t;
    });
  }

  window.PotentialCMS = { read: read, write: write };

  if (document.querySelector('[data-cms], [data-cms-img]')) {
    fetch('assets/data/content.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(apply)
      .catch(function () {});
  }
})();
