/* ==========================================================================
   构建 GitHub Pages（纯静态）发布产物 → dist/
   用法：node tools/build-pages.mjs
   ========================================================================== */
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join as pjoin, relative } from 'node:path';

const ROOT = pjoin(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = pjoin(ROOT, 'dist');

/* 需要剔除的东西：后台、服务器、开发脚本、备份 */
const EXCLUDE_FILES = new Set([
  'admin.html',
  'serve.sh',
  'README.md',
  'tools',
  'dist',
  '.git',
  '.gitignore',
  'package.json',
  'package-lock.json',
  'node_modules',
]);

const EXCLUDE_SUFFIX = ['.bak', '.tmp'];

/* 后台专用资源（纯静态站点用不到，去掉可省 45KB） */
const EXCLUDE_ASSETS = new Set(['admin.js', 'admin.css']);
const EXCLUDE_DIRS = new Set(['.trash']);

function shouldSkip(name, isDir) {
  if (EXCLUDE_FILES.has(name)) return true;
  if (!isDir && EXCLUDE_ASSETS.has(name)) return true;
  if (EXCLUDE_SUFFIX.some((s) => name.endsWith(s))) return true;
  if (isDir && EXCLUDE_DIRS.has(name)) return true;
  return false;
}

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = pjoin(src, name);
    const d = pjoin(dest, name);
    const st = statSync(s);
    if (shouldSkip(name, st.isDirectory())) continue;
    if (st.isDirectory()) copyTree(s, d);
    else cpSync(s, d);
  }
}

/* ------------------------------------------------------------------ 404 */
const NOT_FOUND = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>页面走丢了 · POTENTIAL</title>
<meta name="robots" content="noindex" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23090a0d'/%3E%3Cpath d='M9 24V8h7a5 5 0 0 1 0 10h-7' fill='none' stroke='%23ff3d2e' stroke-width='2.4' stroke-linecap='square'/%3E%3C/svg%3E" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
<div class="page">
  <main id="main">
    <section class="section" style="min-height:100svh;display:grid;place-items:center">
      <div class="wrap" style="text-align:center">
        <p class="eyebrow" style="justify-content:center">Error 404</p>
        <h1 class="h1" style="margin-top:18px">这个页面<br />没有造出来</h1>
        <p class="lead" style="margin:22px auto 0;max-width:44ch">
          链接可能已经失效，或者页面还没上线。<br />回到首页，或者去影像库看看我们在做什么。
        </p>
        <div class="hero__actions" style="justify-content:center;margin-top:32px">
          <a class="btn btn--primary" href="/">回到首页</a>
          <a class="btn btn--ghost" href="/gallery.html">看影像</a>
        </div>
      </div>
    </section>
  </main>
</div>
</body>
</html>
`;

/* ------------------------------------------------------------------ build */
if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

copyTree(ROOT, DIST);

writeFileSync(pjoin(DIST, '.nojekyll'), '', 'utf8');
writeFileSync(pjoin(DIST, '404.html'), NOT_FOUND, 'utf8');
writeFileSync(
  pjoin(DIST, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: https://sharpry2006.github.io/Potential-Website/sitemap.xml\n',
  'utf8'
);

/* 统计 + 自检 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = pjoin(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push({ path: p, size: st.size });
  }
  return out;
}
const files = walk(DIST);
const total = files.reduce((a, f) => a + f.size, 0);

// 不允许残留后台页面或 API 调用
const htmlFiles = files.filter((f) => f.path.endsWith('.html'));
const problems = [];
for (const f of htmlFiles) {
  const txt = readFileSync(f.path, 'utf8');
  // admin.html 只允许出现在 .js-admin-only 提示里（纯静态站会自动隐藏）
  const re = /href="admin\.html[^"]*"/g;
  let m;
  while ((m = re.exec(txt))) {
    const before = txt.slice(Math.max(0, m.index - 500), m.index);
    if (before.lastIndexOf('js-admin-only') < before.lastIndexOf('js-public-only')) {
      problems.push(`${relative(DIST, f.path)} 有暴露给公开访客的 admin 链接`);
    }
  }
  if (/\/api\//.test(txt)) problems.push(`${relative(DIST, f.path)} 仍包含 /api/ 调用`);
}
for (const f of files.filter((x) => x.path.endsWith('.js'))) {
  const txt = readFileSync(f.path, 'utf8');
  if (/'\/api\//.test(txt)) problems.push(`${relative(DIST, f.path)} 仍包含 /api/ 调用`);
}

console.log(`✓ 已生成 dist/ —— ${files.length} 个文件，共 ${(total / 1024 / 1024).toFixed(2)} MB`);
console.log('  页面：' + htmlFiles.map((f) => relative(DIST, f.path)).join(', '));
if (problems.length) {
  console.log('\n⚠ 需要处理：');
  problems.forEach((p) => console.log('  - ' + p));
  process.exitCode = 1;
} else {
  console.log('✓ 自检通过：没有后台页面，也没有残留的 /api 调用');
}
