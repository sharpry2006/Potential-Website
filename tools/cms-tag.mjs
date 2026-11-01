// Adds data-cms keys to editable plain-text elements of every page. Idempotent: old keys are stripped first.
// Runs automatically at the end of tools/gen.mjs; can also be run alone: node tools/cms-tag.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index', 'about', 'robots', 'results', 'hall', 'join', 'gallery'];
const TEXT = new Set(['h1', 'h2', 'h3', 'h4', 'p', 'summary', 'span', 'b', 'small', 'cite', 'dt', 'dd', 'a', 'button', 'li', 'em', 'label', 'strong']);
const VOID = new Set(['br', 'img', 'meta', 'link', 'input', 'hr', 'source']);
const Q = String.fromCharCode(34);
const KEY = ' data-cms=' + Q;
const TAGRE = new RegExp('<(/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>', 'y');

function hasLetter(s) {
  for (const c of s) if (c.toLowerCase() !== c.toUpperCase() || c.charCodeAt(0) > 0x2e80) return true;
  return false;
}
function textOf(s) {
  let out = '';
  let inTag = false;
  for (const c of s) {
    if (c === '<') inTag = true;
    else if (c === '>') inTag = false;
    else if (!inTag) out += c;
  }
  return out;
}
function strip(html) {
  let i;
  while ((i = html.indexOf(KEY)) >= 0) {
    const j = html.indexOf(Q, i + KEY.length);
    html = html.slice(0, i) + html.slice(j + 1);
  }
  return html;
}
function isSite(name, attrs) {
  return (name === 'header' && attrs.includes('site-header')) || (name === 'footer' && attrs.includes('site-footer')) || (name === 'div' && attrs.includes('nav__drawer'));
}

function tag(html, page) {
  html = strip(html);
  const stack = [];
  const edits = [];
  const counters = {};
  let pos = 0;
  for (;;) {
    const lt = html.indexOf('<', pos);
    if (lt < 0) break;
    if (html.startsWith('<!--', lt)) {
      const e = html.indexOf('-->', lt);
      pos = e < 0 ? html.length : e + 3;
      continue;
    }
    TAGRE.lastIndex = lt;
    const m = TAGRE.exec(html);
    if (!m) { pos = lt + 1; continue; }
    const end = lt + m[0].length;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const attrs = m[3];
    pos = end;
    if (!closing) {
      if (name === 'script' || name === 'style') {
        const e = html.indexOf('</' + name, end);
        pos = e < 0 ? html.length : e;
        continue;
      }
      const top = stack[stack.length - 1];
      if (top) {
        if (name === 'svg') top.svg = true;
        else if (name !== 'br' && !top.inSvg) top.child = true;
      }
      if (VOID.has(name) || attrs.trim().endsWith('/')) continue;
      stack.push({
        name, attrs, openEnd: end, svg: false, child: false,
        inSvg: name === 'svg' || !!(top && top.inSvg),
        site: !!(top && top.site) || isSite(name, attrs)
      });
    } else {
      let k = stack.length - 1;
      while (k >= 0 && stack[k].name !== name) k--;
      if (k < 0) continue;
      const el = stack[k];
      stack.length = k;
      if (!TEXT.has(el.name) || el.child || el.inSvg || el.attrs.includes('data-count')) continue;
      if (!hasLetter(textOf(html.slice(el.openEnd, lt)))) continue;
      const prefix = el.site ? 'site' : page;
      counters[prefix] = (counters[prefix] || 0) + 1;
      edits.push([el.openEnd - 1, KEY + prefix + '.' + counters[prefix] + Q]);
    }
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [at, str] of edits) html = html.slice(0, at) + str + html.slice(at);
  return [html, edits.length];
}

for (const p of PAGES) {
  const file = join(root, p + '.html');
  const src = readFileSync(file, 'utf8');
  const [out, n] = tag(src, p);
  if (out !== src) writeFileSync(file, out, 'utf8');
  console.log('cms-tag', p + '.html', n);
}
