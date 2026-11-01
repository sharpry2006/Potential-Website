/* Optional page generator — keeps header/footer identical across pages.
   Run: node tools/gen.mjs     (outputs static .html files; safe to re-run) */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join as pjoin } from 'node:path';

const root = pjoin(dirname(fileURLToPath(import.meta.url)), '..');

const NAV = [
  ['index.html', '首页'],
  ['about.html', '战队'],
  ['robots.html', '机甲与团队'],
  ['gallery.html', '影像'],
  ['results.html', '战绩'],
  ['hall.html', '名人堂'],
  ['join.html', '加入我们']
];

/* 站点公开地址（GitHub Pages）。canonical / og:image 必须是绝对地址 */
const SITE = 'https://sharpry2006.github.io/Potential-Website/';

const head = (title, desc, file) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="theme-color" content="#08090c" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="POTENTIAL" />
<meta property="og:locale" content="zh_CN" />
<meta property="og:url" content="${SITE}${file}" />
<meta property="og:image" content="${SITE}assets/img/og-cover.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="POTENTIAL · 南京邮电大学机甲大师战队" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${SITE}assets/img/og-cover.jpg" />
<link rel="canonical" href="${SITE}${file}" />
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23090a0d'/%3E%3Cpath d='M9 24V8h7a5 5 0 0 1 0 10h-7' fill='none' stroke='%23ff3d2e' stroke-width='2.4' stroke-linecap='square'/%3E%3C/svg%3E" />
<link rel="preload" href="assets/fonts/ptsans-cn-regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="assets/fonts/grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="assets/css/style.css?v=3" />
<link rel="stylesheet" href="assets/css/motion.css?v=1" />
</head>
<body>
<a class="skip-link" href="#main">跳到主要内容</a>
<div class="scroll-bar" aria-hidden="true"></div>
`;

const header = (active) => `
<header class="site-header">
  <div class="wrap">
    <nav class="nav" aria-label="主导航">
      <a class="brand" href="index.html" aria-label="POTENTIAL 战队首页">
        <img class="brand__mark" src="assets/img/logo-mark.png" alt="" width="26" height="29" />
        <span class="brand__text">
          <span class="brand__name">Potential</span>
          <span class="brand__sub">南京邮电大学 · 机甲大师</span>
        </span>
      </a>
      <ul class="nav__links">
${NAV.map(
  ([href, label]) =>
    `        <li><a class="nav__link" href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a></li>`
).join('\n')}
      </ul>
      <div class="nav__end">
        <button class="nav__search" type="button" onclick="PotentialSearch.open()" aria-label="快速跳转">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"/><path d="M16 16l4.4 4.4"/></svg>
          <kbd>⌘K</kbd>
        </button>
        <a class="nav__cta" href="join.html">2026 招新</a>
        <button class="nav__toggle" type="button" aria-label="打开菜单" aria-expanded="false"><span></span></button>
      </div>
    </nav>
  </div>
</header>

<div class="nav__drawer" aria-label="移动端导航">
${NAV.map(([href, label], i) => `  <a href="${href}"><span>${label}</span><span>0${i + 1}</span></a>`).join('\n')}
</div>
`;

const footer = `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="index.html">
          <img class="brand__mark" src="assets/img/logo-mark.png" alt="" width="26" height="29" />
          <span class="brand__text">
            <span class="brand__name">Potential</span>
            <span class="brand__sub">南京邮电大学 · 机甲大师</span>
          </span>
        </a>
        <p>潜心高远，此志无双。<br />南京邮电大学 RoboMaster 机甲大师战队，由工程实验教学部创建并指导。</p>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <ul>
          <li><a href="about.html">战队简介</a></li>
          <li><a href="robots.html">机甲与团队</a></li>
          <li><a href="results.html">战绩与赛季</a></li>
          <li><a href="join.html">加入我们</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul>
          <li><a href="https://space.bilibili.com/3546863781283927" target="_blank" rel="noopener">B 站 · 南邮 Potential 战队</a></li>
          <li><span>南京邮电大学仙林校区</span></li>
          <li><span>南京市栖霞区文苑路 9 号</span></li>
          <li><span>依托 · 工程实验教学部</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> NJUPT Potential Robotics Team · 本站为校内展示用途</span>
      <span class="footer-bottom__note">RoBoMaster is a trademark of DJI</span>
    </div>

    <div class="footer-wordmark">
      <a class="footer-top" href="#top">回到顶部
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V4M4 8l4-4 4 4"/></svg>
      </a>
      <img src="assets/img/logo-word-2x.png" alt="" aria-hidden="true" width="2240" height="260" loading="lazy" decoding="async" />
    </div>
  </div>
</footer>
</div>

<script src="assets/js/palette.js?v=3" defer></script>
<script src="assets/js/site.js?v=3" defer></script>
<script src="assets/js/motion.js?v=1" defer></script>
<script src="assets/js/gallery.js?v=3" defer></script>
</body>
</html>
`;

const page = (active, title, desc, body) => head(title, desc, active) + header(active) + body + footer;

/* ------------------------------------------------------------------ pages */

const aboutBody = `<div class="page">
<main id="main">

  <section class="page-hero" data-watermark="Team">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>战队</span>
        </nav>
        <h1 class="h1">关于 POTENTIAL</h1>
        <p class="lead page-hero__lead">
          一支由本科生组成的机甲战队，把课堂里的力学、电路与算法，
          变成赛场上能跑、能打、能赢的机器人。
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div>
          <p class="eyebrow" data-reveal>Profile</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">从一张图纸<br />到一台能上场的机甲</h2>
          <p class="lead mt-m" data-reveal data-reveal-delay="120">
            Potential 战队由南京邮电大学工程实验教学部创建并指导。战队以 RoboMaster 机甲大师系列赛事为主线，
            自主完成机械结构设计、嵌入式电控开发、视觉算法与整机调试，并独立承担赛事运营与宣传。
          </p>
          <p class="mt-m dim" data-reveal data-reveal-delay="180" style="max-width:52ch">
            工程实验教学部在场地、设备及技术支持上为战队提供了坚实保障——
            这意味着队员可以在真实的加工与测试环境中，把每一次改动快速验证为可上场的性能提升。
          </p>
        </div>
        <ul class="spec-list" data-reveal data-reveal-delay="120">
          <li><b>战队名称</b><span>Potential · 潜能之队</span></li>
          <li><b>所属高校</b><span>南京邮电大学</span></li>
          <li><b>依托单位</b><span>工程实验教学部（创建并指导）</span></li>
          <li><b>主攻赛事</b><span>RoboMaster 机甲大师赛 · 高校联盟赛 / 超级对抗赛</span></li>
          <li><b>战队口号</b><span>潜心高远，此志无双</span></li>
          <li><b>基地</b><span>南京邮电大学仙林校区（南京市栖霞区文苑路 9 号）</span></li>
          <li><b>技术方向</b><span>机械结构 · 嵌入式电控 · 视觉算法 · 软件与仿真 · 运营宣传</span></li>
          <li><b>最佳战绩</b><span>RoboMaster 2026 机甲大师高校联盟赛（江苏站）季军 · 校史最佳</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="feature-row">
        <div class="feature" data-reveal>
          <span class="feature__k">01 / Self-built</span>
          <h3>全流程自研</h3>
          <p>从结构建模、加工装配到电控与视觉，整机由队员自主完成，技术栈完整、可迭代、可传承。</p>
        </div>
        <div class="feature" data-reveal data-reveal-delay="70">
          <span class="feature__k">02 / Match-driven</span>
          <h3>以赛场为标准</h3>
          <p>所有设计决策最终都要接受对抗赛的检验：稳定性、响应速度与容错能力，比纸面参数更重要。</p>
        </div>
        <div class="feature" data-reveal data-reveal-delay="140">
          <span class="feature__k">03 / Mentorship</span>
          <h3>带训与传承</h3>
          <p>老队员带新队员，把调试经验沉淀为文档与规范，让每一届都能站在上一届的肩膀上起跑。</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>赛季节奏</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">一年的时间，<br />被切成六个阶段</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            RoboMaster 的赛季以规则发布为起点。规则一变，方案就要重算——
            这正是工程师最真实的日常。
          </p>
        </div>
      </div>

      <div class="steps">
        <div class="step" data-reveal><span class="step__no">PHASE 01</span><h3>规则研判</h3><p>逐条拆解新赛季规则，评估改动对兵种定位、尺寸与功率预算的影响。</p></div>
        <div class="step" data-reveal data-reveal-delay="50"><span class="step__no">PHASE 02</span><h3>方案设计</h3><p>结构、电控、视觉三线并行出方案，用评审会筛掉不可行的想法。</p></div>
        <div class="step" data-reveal data-reveal-delay="100"><span class="step__no">PHASE 03</span><h3>打样与加工</h3><p>从图纸到实物：加工、装配、走线，把设计意图兑现成可用的零件。</p></div>
        <div class="step" data-reveal><span class="step__no">PHASE 04</span><h3>校内赛验证</h3><p>在校内赛中第一次真机对抗，暴露问题、收集数据、快速迭代。</p></div>
        <div class="step" data-reveal data-reveal-delay="50"><span class="step__no">PHASE 05</span><h3>联盟赛冲刺</h3><p>高强度集训，围绕稳定性与临场策略反复演练，直到每个动作都成为肌肉记忆。</p></div>
        <div class="step" data-reveal data-reveal-delay="100"><span class="step__no">PHASE 06</span><h3>复盘与沉淀</h3><p>比赛结束不是终点：复盘文档、代码与结构归档，成为下一赛季的起点。</p></div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>技术方向</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">五个方向，<br />一台整机</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            没有人能独自造出一台机器人。分工让我们走得更深，协作让我们走得更远。
          </p>
        </div>
      </div>
      <div>
        <div class="disc" data-reveal>
          <span class="disc__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></span>
          <div class="disc__name"><h3>机械结构</h3><span>Mechanical</span></div>
          <div class="disc__body">
            <p>整机布局、传动与发射机构设计，兼顾强度、轻量化与可维护性；从三维建模到加工装配的完整链条。</p>
            <div class="chips"><span class="chip">结构设计</span><span class="chip">加工装配</span><span class="chip">轻量化</span><span class="chip">可维护性</span></div>
          </div>
        </div>
        <div class="disc" data-reveal>
          <span class="disc__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.2"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/></svg></span>
          <div class="disc__name"><h3>嵌入式电控</h3><span>Embedded</span></div>
          <div class="disc__body">
            <p>主控固件、电机驱动与功率管理，自研电调与总线通信让底盘与云台的响应更直接、更可控。</p>
            <div class="chips"><span class="chip">MCU 固件</span><span class="chip">CAN 总线</span><span class="chip">自研电调</span><span class="chip">PID 调参</span></div>
          </div>
        </div>
        <div class="disc" data-reveal>
          <span class="disc__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="12.5" height="10" rx="1.5"/><circle cx="9.2" cy="12" r="2.8"/><path d="M15.5 10H20v6h-4.5"/></svg></span>
          <div class="disc__name"><h3>视觉算法</h3><span>Vision</span></div>
          <div class="disc__body">
            <p>装甲板识别、目标跟踪与弹道解算，让云台在高速对抗中依然稳、准、快。</p>
            <div class="chips"><span class="chip">目标检测</span><span class="chip">位姿解算</span><span class="chip">跟踪滤波</span><span class="chip">弹道补偿</span></div>
          </div>
        </div>
        <div class="disc" data-reveal>
          <span class="disc__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 9.2l2.8 2.8L7 14.8M12.6 15h4"/></svg></span>
          <div class="disc__name"><h3>软件与仿真</h3><span>Software</span></div>
          <div class="disc__body">
            <p>上位机调试工具、数据回放与仿真验证，让「改一版试试」的成本尽可能低。</p>
            <div class="chips"><span class="chip">调试上位机</span><span class="chip">数据回放</span><span class="chip">仿真验证</span><span class="chip">工具链</span></div>
          </div>
        </div>
        <div class="disc" data-reveal>
          <span class="disc__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg></span>
          <div class="disc__name"><h3>运营与宣传</h3><span>Operations</span></div>
          <div class="disc__body">
            <p>招新、赛事记录、影像与对外沟通。让队伍被看见，也让技术之外的软实力成为战力。</p>
            <div class="chips"><span class="chip">招新</span><span class="chip">影像记录</span><span class="chip">赛事运营</span><span class="chip">对外合作</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="join-panel" data-reveal>
        <div class="join-panel__grid" aria-hidden="true"></div>
        <div class="join-panel__inner">
          <div>
            <p class="eyebrow">Next</p>
            <h2 class="h2" style="margin-top:18px">想看看<br />更具体的东西？</h2>
            <p class="lead" style="margin-top:18px;max-width:42ch">
              兵种拆解、技术细节与赛季战绩，都在下一页里。
            </p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end">
            <a class="btn btn--primary" href="robots.html">机甲与团队<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
            <a class="btn btn--ghost" href="results.html">战绩</a>
          </div>
        </div>
      </div>
    </div>
  </section>

</main>
`;

const robotsBody = `<div class="page">
<main id="main">

  <section class="page-hero" data-watermark="Machine">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>机甲与团队</span>
        </nav>
        <h1 class="h1">机甲与团队</h1>
        <p class="lead page-hero__lead">
          七个兵种，五个技术方向，一条从需求到赛场的研发链路。
          这里是我们把想法变成机甲的方法。
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>兵种体系</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">七种角色，<br />一支队伍的完整拼图</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            RoboMaster 的对抗是体系化的：输出、控制、后勤、信息与空中支援缺一不可。
            每种兵种都有自己的性能边界与胜负权重。
          </p>
        </div>
      </div>

      <div>
        <div class="module" data-reveal>
          <div class="module__idx">01</div>
          <div class="module__main">
            <h3>英雄机器人</h3>
            <span class="en">Hero Robot · 高伤害攻坚</span>
            <p>承担主要火力输出。大口径发射机构的弹道一致性、供弹连续性以及高热量下的射击节奏，决定它在关键交火中的压制力。</p>
          </div>
          <div class="module__side"><span class="tag">大口径</span><span class="tag">热量管理</span><span class="tag">供弹链</span><span class="tag">结构强度</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">02</div>
          <div class="module__main">
            <h3>工程机器人</h3>
            <span class="en">Engineer · 后勤与救援</span>
            <p>负责取弹、救援与场地交互。机械臂的定位精度、抓取容错与动作耗时，直接决定队伍在劣势局里的翻盘可能。</p>
          </div>
          <div class="module__side"><span class="tag">机械臂</span><span class="tag">抓取</span><span class="tag">救援</span><span class="tag">容错</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">03</div>
          <div class="module__main">
            <h3>步兵机器人</h3>
            <span class="en">Standard · 主力输出</span>
            <p>队伍数量最多、机动性最强的单位。底盘灵活性与云台稳定性共同决定命中率，操作手手感与视觉自瞄的配合是核心课题。</p>
          </div>
          <div class="module__side"><span class="tag">17mm</span><span class="tag">自瞄</span><span class="tag">麦轮底盘</span><span class="tag">高机动</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">04</div>
          <div class="module__main">
            <h3>哨兵机器人</h3>
            <span class="en">Sentry · 全自主巡逻</span>
            <p>沿轨道自主移动，无需操作手干预。目标优先级判定、路径决策与长时间运行的稳定性，是它的全部战场。</p>
          </div>
          <div class="module__side"><span class="tag">自动决策</span><span class="tag">目标判定</span><span class="tag">轨道移动</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">05</div>
          <div class="module__main">
            <h3>空中机器人</h3>
            <span class="en">Aerial · 制空支援</span>
            <p>高速争夺制空权的飞行单位。飞控调参、动力冗余与结构轻量化之间必须取得平衡，任何一处短板都会在对抗中被放大。</p>
          </div>
          <div class="module__side"><span class="tag">飞控</span><span class="tag">轻量化</span><span class="tag">动力冗余</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">06</div>
          <div class="module__main">
            <h3>飞镖系统</h3>
            <span class="en">Dart · 远距打击</span>
            <p>以远距离精确命中换取战术优势。发射一致性、气动稳定性与命中判定算法共同决定它能否真正改变战局。</p>
          </div>
          <div class="module__side"><span class="tag">远距</span><span class="tag">气动稳定</span><span class="tag">命中判定</span></div>
        </div>
        <div class="module" data-reveal>
          <div class="module__idx">07</div>
          <div class="module__main">
            <h3>雷达站</h3>
            <span class="en">Radar · 信息优势</span>
            <p>为全队提供对手位置信息。多目标追踪、坐标解算与信息推送的延迟，直接压缩对手的行动空间。</p>
          </div>
          <div class="module__side"><span class="tag">多目标追踪</span><span class="tag">坐标解算</span><span class="tag">低延迟</span></div>
        </div>
      </div>

      <div class="notice mt-l" data-reveal>
        <span>hint</span>
        <p><b>说明：</b>兵种构成与具体性能参数以当赛季 RoboMaster 官方规则为准；本站描述聚焦于战队在各兵种上的研发侧重。</p>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="split split--reverse">
        <div>
          <p class="eyebrow" data-reveal>Tech Stack</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">技术栈：<br />从毫米到毫秒</h2>
          <p class="lead mt-m" data-reveal data-reveal-delay="120">
            机械关心毫米级的装配公差，电控关心毫秒级的控制周期，视觉关心每一帧的稳定性。
            五个方向在同一台机器上互相牵制，也互相成就。
          </p>
          <div class="team-strip mt-m" data-reveal data-reveal-delay="180">
            <span><b>机械</b></span><span>电控</span><span><b>视觉</b></span><span>软件</span><span><b>运营</b></span>
          </div>
        </div>
        <div>
          <div class="steps" style="grid-template-columns:1fr 1fr">
            <div class="step" data-reveal><span class="step__no">STEP 01</span><h3>需求与方案</h3><p>明确兵种定位与性能目标，输出可评审的方案。</p></div>
            <div class="step" data-reveal data-reveal-delay="50"><span class="step__no">STEP 02</span><h3>结构设计</h3><p>三维建模与运动校核，确定装配关系与公差。</p></div>
            <div class="step" data-reveal data-reveal-delay="100"><span class="step__no">STEP 03</span><h3>打样加工</h3><p>快速打样验证关键结构，缩短试错周期。</p></div>
            <div class="step" data-reveal data-reveal-delay="150"><span class="step__no">STEP 04</span><h3>装配调试</h3><p>整机装配、走线与固件联调，逐项排除干扰。</p></div>
            <div class="step" data-reveal><span class="step__no">STEP 05</span><h3>对抗测试</h3><p>在真实对抗中收集数据，定位瓶颈。</p></div>
            <div class="step" data-reveal data-reveal-delay="50"><span class="step__no">STEP 06</span><h3>复盘迭代</h3><p>归档问题与改进项，进入下一轮循环。</p></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>开发日志</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">被记录下来的<br />每一次进步</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            轮腿底盘、飞镖系统、自制电调与快速打样——这些关键词背后，是一个个具体的技术攻坚。
          </p>
        </div>
      </div>

      <div class="media-grid">
        <a class="media" href="https://www.bilibili.com/video/BV1nfH76GEiU" target="_blank" rel="noopener" data-reveal>
          <div class="media__thumb">
            <img src="assets/img/media/wheelleg.webp" alt="轮腿开发视频封面" width="1280" height="720" loading="lazy" />
            <div class="media__pattern"></div>
            <span class="media__play"><svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></span>
            <span class="media__dur">DEVLOG</span>
          </div>
          <div class="media__body">
            <span class="media__kicker">Chassis</span>
            <h3 class="media__title">轮腿开发：让底盘学会「站起来」</h3>
            <p class="media__meta">B 站 · 南邮 Potential 战队</p>
          </div>
        </a>
        <a class="media" href="https://www.bilibili.com/video/BV1CetW6LEKa" target="_blank" rel="noopener" data-reveal data-reveal-delay="70">
          <div class="media__thumb">
            <img src="assets/img/media/wheelleg2.webp" alt="轮腿加工视频封面" width="1280" height="720" loading="lazy" />
            <div class="media__pattern"></div>
            <span class="media__play"><svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></span>
            <span class="media__dur">DEVLOG</span>
          </div>
          <div class="media__body">
            <span class="media__kicker">Machining</span>
            <h3 class="media__title">轮腿加工：把图纸变成金属</h3>
            <p class="media__meta">B 站 · 南邮 Potential 战队</p>
          </div>
        </a>
        <a class="media" href="https://www.bilibili.com/video/BV1S5Hx65Ecx" target="_blank" rel="noopener" data-reveal data-reveal-delay="140">
          <div class="media__thumb">
            <img src="assets/img/media/dart.webp" alt="飞镖系统视频封面" width="1280" height="720" loading="lazy" />
            <div class="media__pattern"></div>
            <span class="media__play"><svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></span>
            <span class="media__dur">DEVLOG</span>
          </div>
          <div class="media__body">
            <span class="media__kicker">Dart System</span>
            <h3 class="media__title">飞镖系统：远距离的精确一击</h3>
            <p class="media__meta">B 站 · 南邮 Potential 战队</p>
          </div>
        </a>
        <a class="media" href="https://www.bilibili.com/video/BV1URGF6UEJz" target="_blank" rel="noopener" data-reveal data-reveal-delay="210">
          <div class="media__thumb">
            <img src="assets/img/media/prototype.webp" alt="高效打样视频封面" width="1280" height="720" loading="lazy" />
            <div class="media__pattern"></div>
            <span class="media__play"><svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></span>
            <span class="media__dur">DEVLOG</span>
          </div>
          <div class="media__body">
            <span class="media__kicker">Prototyping</span>
            <h3 class="media__title">高效打样：让试错变便宜</h3>
            <p class="media__meta">B 站 · 南邮 Potential 战队</p>
          </div>
        </a>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="join-panel" data-reveal>
        <div class="join-panel__grid" aria-hidden="true"></div>
        <div class="join-panel__inner">
          <div>
            <p class="eyebrow">Join</p>
            <h2 class="h2" style="margin-top:18px">这些技术，<br />都可以从零学起</h2>
            <p class="lead" style="margin-top:18px;max-width:42ch">
              我们更看重你拆解问题的耐心，而不是你已经会多少工具。
            </p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end">
            <a class="btn btn--primary" href="join.html">加入我们<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
          </div>
        </div>
      </div>
    </div>
  </section>

</main>
`;

const resultsBody = `<div class="page">
<main id="main">

  <section class="page-hero" data-watermark="Results">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>战绩</span>
        </nav>
        <h1 class="h1">战绩与赛季</h1>
        <p class="lead page-hero__lead">
          记分牌不会说谎。我们用一台台整机，把赛季的努力换算成可以查证的排名。
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="result-hero" data-reveal>
        <div>
          <div class="result-hero__medal">
            <small>RMUL 2026 · JIANGSU</small>
            季<span>军</span>
          </div>
          <p class="lead" style="margin-top:18px;max-width:36ch">
            南京邮电大学在 RoboMaster 机甲大师高校联盟赛中的历史最佳战绩。
          </p>
        </div>
        <div>
          <ul class="result-hero__list">
            <li><span>赛事</span><span>RoboMaster 2026 机甲大师高校联盟赛 · 江苏站</span></li>
            <li><span>时间</span><span>2026 年 3 月 27 — 29 日</span></li>
            <li><span>地点</span><span>江苏无锡 · 江阴市体育馆（赛事首度落地江阴）</span></li>
            <li><span>规模</span><span>全国 30 支高校战队</span></li>
            <li><span>同场强队</span><span>浙江大学 · 武汉大学 · 东南大学 · 南京理工大学 等</span></li>
            <li><span>指导单位</span><span>南京邮电大学 工程实验教学部</span></li>
          </ul>
        </div>
      </div>

      <div class="feature-row">
        <div class="feature" data-reveal>
          <span class="feature__k">League</span>
          <h3>高校联盟赛 RMUL</h3>
          <p>全国大学生机器人大赛 RoboMaster 的重要组成部分，以 3V3 对抗赛与 1V1 步兵对抗赛为主，重点考查综合运用理工科知识与工程实践的能力。</p>
        </div>
        <div class="feature" data-reveal data-reveal-delay="70">
          <span class="feature__k">Season 2026</span>
          <h3>更智能的赛季</h3>
          <p>2026 赛季在赛事中增设了更多自动化与智能化元素，全面考验队伍在机器人设计、视觉识别与战术策略上的综合创新能力。</p>
        </div>
        <div class="feature" data-reveal data-reveal-delay="140">
          <span class="feature__k">Approach</span>
          <h3>稳定性优先</h3>
          <p>自规则发布以来，队员在高强度集训中不断攻克技术难题，以机器人性能与团队协作作为赛场上的主要胜负手。</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>赛季时间线</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">一步一步<br />走到领奖台</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            从第一次登上联盟赛赛场，到首次站上领奖台，中间隔着无数个调试到深夜的夜晚。
          </p>
        </div>
      </div>

      <div class="timeline">
        <div class="tl-item" data-reveal>
          <div class="tl-item__date">2026 · 03</div>
          <div class="tl-item__body">
            <h3>RMUL 2026 江苏站 · 季军</h3>
            <p>30 支高校队伍同场竞技，战队在小组赛与淘汰赛中稳定输出，最终夺得季军，创下南邮在该项赛事的最佳战绩。</p>
            <span class="tl-item__tag">Best Result</span>
          </div>
        </div>
        <div class="tl-item" data-reveal>
          <div class="tl-item__date">2025.10 — 2026.03</div>
          <div class="tl-item__body">
            <h3>赛季集训：规则发布后的六个月</h3>
            <p>自 2025 年 10 月赛事规则发布以来，队员在高强度集训中不断攻克技术难题，围绕整机稳定性与对抗策略持续迭代。</p>
            <span class="tl-item__tag">Training</span>
          </div>
        </div>
        <div class="tl-item" data-reveal>
          <div class="tl-item__date">2025 · 11</div>
          <div class="tl-item__body">
            <h3>RoboMaster 校内赛 · 新生机器人对抗赛</h3>
            <p>面向新队员的校内实战：组队、设计、装配、上场对抗，完整走通一遍赛季流程，也成为战队选拔与人才培养的重要环节。</p>
            <span class="tl-item__tag">Grassroots</span>
          </div>
        </div>
        <div class="tl-item" data-reveal>
          <div class="tl-item__date">2025 · 03</div>
          <div class="tl-item__body">
            <h3>RMUL 2025 上海站 · 首登赛场</h3>
            <p>战队在 RoboMaster 2025 机甲大师高校联盟赛（上海站）登场亮相，与多支成熟战队同场交手，完成从实验室到赛场的跨越。</p>
            <span class="tl-item__tag">Debut</span>
          </div>
        </div>
        <div class="tl-item" data-reveal>
          <div class="tl-item__date">2026.04 — 2026.10</div>
          <div class="tl-item__body">
            <h3>赛季之后：技术沉淀继续进行</h3>
            <p>联盟赛结束后，战队没有停下：轮腿底盘、飞镖系统与自研电调等方向继续推进，并把过程记录成公开的开发日志。</p>
            <span class="tl-item__tag">Off-season</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="split">
        <div>
          <p class="eyebrow" data-reveal>Matches</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">交手记录</h2>
          <p class="lead mt-m" data-reveal data-reveal-delay="120">
            部分可查证的比赛场次。完整赛程与比分请以 RoboMaster 官方赛事记录为准。
          </p>
        </div>
        <div class="matches" data-reveal data-reveal-delay="120">
          <div class="match">
            <span class="match__date">2026.03.29</span>
            <span class="match__vs">RMUL 2026 江苏站 第 56 场 · 对阵 <b>江南大学（霞客湾校区）SHARK 战队</b></span>
            <span class="match__tag">RMUL</span>
          </div>
          <div class="match">
            <span class="match__date">2026.03.28</span>
            <span class="match__vs">RMUL 2026 江苏站 第 40 场 · 对阵 <b>集美大学 科来战队</b></span>
            <span class="match__tag">RMUL</span>
          </div>
          <div class="match">
            <span class="match__date">2025.03.29</span>
            <span class="match__vs">RMUL 2025 上海站 第 42 场 · 对阵 <b>常州大学 Climber 战队</b></span>
            <span class="match__tag">RMUL</span>
          </div>
          <div class="match">
            <span class="match__date">2025.03</span>
            <span class="match__vs">RMUL 2025 上海站 · 首次参加 RoboMaster 高校联盟赛</span>
            <span class="match__tag">Debut</span>
          </div>
        </div>
      </div>

      <div class="sec-head" style="margin-top:clamp(50px,7vw,96px)">
        <div>
          <span class="sec-head__index">赛事体系</span>
          <h2 class="h2">我们打的<br />是什么比赛</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead">
            RoboMaster 机甲大师赛由大疆创新发起，是全国大学生机器人大赛的重要组成部分。
            不同赛事形式对应不同的技术侧重，也是我们安排研发重心的依据。
          </p>
        </div>
      </div>

      <div class="league-grid">
        <article class="league" data-reveal>
          <span class="league__k">RMUL</span>
          <h3>高校联盟赛</h3>
          <span class="league__en">University League</span>
          <p>以 3V3 对抗赛与 1V1 步兵对抗赛为主，重点考查机器人设计、视觉识别与战术配合的综合能力，
            也是多数队伍进入 RoboMaster 的起点。</p>
          <ul class="league__list">
            <li><span>形式</span><span>3V3 团队对抗 / 1V1 步兵对抗</span></li>
            <li><span>侧重</span><span>整机稳定性与团队协作</span></li>
          </ul>
        </article>

        <article class="league" data-reveal data-reveal-delay="70">
          <span class="league__k">RMUC</span>
          <h3>超级对抗赛</h3>
          <span class="league__en">University Championship</span>
          <p>完整的兵种体系与更复杂的战场机制：英雄、工程、步兵、哨兵、空中与飞镖协同作战，
            对系统化工程能力提出更高要求。</p>
          <ul class="league__list">
            <li><span>形式</span><span>多兵种协同的完整对抗</span></li>
            <li><span>侧重</span><span>系统集成与战术执行</span></li>
          </ul>
        </article>

        <article class="league" data-reveal data-reveal-delay="140">
          <span class="league__k">单项</span>
          <h3>单项赛</h3>
          <span class="league__en">Technical Challenge</span>
          <p>聚焦单一技术方向的专项比拼，例如步兵竞速、工程取弹与算法挑战，
            适合在特定模块上深入打磨。</p>
          <ul class="league__list">
            <li><span>形式</span><span>单一兵种 / 单一技能</span></li>
            <li><span>侧重</span><span>技术深度与极致调试</span></li>
          </ul>
        </article>
      </div>

      <div class="notice mt-l" data-reveal>
        <span>src</span>
        <p><b>资料来源：</b>南京邮电大学官网《南邮获 RoboMaster 2026 机甲大师高校联盟赛季军》（2026-03-30）、RoboMaster 官方赛事视频与战队 B 站公开投稿。赛季排名与规则细节以官方最终公告为准。</p>
      </div>
    </div>
  </section>

</main>
`;

const joinBody = `<div class="page">
<main id="main">

  <section class="page-hero" data-watermark="Join">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>加入我们</span>
        </nav>
        <h1 class="h1">加入 POTENTIAL</h1>
        <p class="lead page-hero__lead">
          我们招募愿意把「我不会」变成「我试试」的人。
          不需要你一开始就什么都会，需要你愿意把问题拆开、再一块块拼好。
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>招募方向</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">你想成为<br />哪一种工程师</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            五个方向面向全校招募，专业不限。我们更关注你的动手意愿、学习曲线与协作方式。
          </p>
        </div>
      </div>

      <div class="card-grid">
        <article class="card" data-reveal>
          <span class="card__corner"></span><span class="card__no">01</span>
          <div class="card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></div>
          <h3 class="card__title">机械结构</h3>
          <span class="card__en">Mechanical</span>
          <p class="card__desc">喜欢把东西拆开再装回去？这里可以从建模、加工一直做到整机装配。</p>
          <div class="card__tags"><span class="tag">设计</span><span class="tag">加工</span><span class="tag">装配</span></div>
        </article>
        <article class="card" data-reveal data-reveal-delay="70">
          <span class="card__corner"></span><span class="card__no">02</span>
          <div class="card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.2"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/></svg></div>
          <h3 class="card__title">嵌入式电控</h3>
          <span class="card__en">Embedded</span>
          <p class="card__desc">写固件、调电机、看波形。让底盘的每一次响应都精确可控。</p>
          <div class="card__tags"><span class="tag">MCU</span><span class="tag">电机驱动</span><span class="tag">通信</span></div>
        </article>
        <article class="card" data-reveal data-reveal-delay="140">
          <span class="card__corner"></span><span class="card__no">03</span>
          <div class="card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="12.5" height="10" rx="1.5"/><circle cx="9.2" cy="12" r="2.8"/><path d="M15.5 10H20v6h-4.5"/></svg></div>
          <h3 class="card__title">视觉算法</h3>
          <span class="card__en">Vision</span>
          <p class="card__desc">让机器人「看懂」赛场：检测、跟踪、解算，最终换来更稳的命中。</p>
          <div class="card__tags"><span class="tag">检测</span><span class="tag">跟踪</span><span class="tag">解算</span></div>
        </article>
        <article class="card" data-reveal>
          <span class="card__corner"></span><span class="card__no">04</span>
          <div class="card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 9.2l2.8 2.8L7 14.8M12.6 15h4"/></svg></div>
          <h3 class="card__title">软件与仿真</h3>
          <span class="card__en">Software</span>
          <p class="card__desc">做工具、搭仿真、写调试上位机，让整个队伍的研发效率更高。</p>
          <div class="card__tags"><span class="tag">工具链</span><span class="tag">上位机</span><span class="tag">仿真</span></div>
        </article>
        <article class="card" data-reveal data-reveal-delay="70">
          <span class="card__corner"></span><span class="card__no">05</span>
          <div class="card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg></div>
          <h3 class="card__title">运营与宣传</h3>
          <span class="card__en">Operations</span>
          <p class="card__desc">拍摄、剪辑、文案、招新与赛事运营——把战队的故事讲给更多人听。</p>
          <div class="card__tags"><span class="tag">影像</span><span class="tag">内容</span><span class="tag">运营</span></div>
        </article>
        <article class="card" data-reveal data-reveal-delay="140" style="display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(150deg,rgba(255,61,46,.1),transparent 60%),var(--ink-700)">
          <span class="card__corner"></span>
          <div>
            <h3 class="card__title">没有相关经验？</h3>
            <span class="card__en">No Experience Needed</span>
            <p class="card__desc">完全可以。战队有带训机制，从工具到方法都会有人带你上手——先看 FAQ 里的常见问题。</p>
          </div>
          <a class="tlink" href="#faq" style="margin-top:24px">查看常见问题<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </article>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="split">
        <div>
          <p class="eyebrow" data-reveal>Process</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">招新流程</h2>
          <p class="lead mt-m" data-reveal data-reveal-delay="120">
            流程不复杂，但每一步都会让你更清楚：自己到底想在这里做成什么。
          </p>
          <div class="notice mt-m" data-reveal data-reveal-delay="180">
            <span>todo</span>
            <p><b>报名通道：</b>本期报名的具体时间、报名表链接与招新群信息，将于招新季在战队官方渠道公布。</p>
          </div>
        </div>
        <div class="join-steps" data-reveal data-reveal-delay="120">
          <div class="join-step"><b>01</b><span>线上报名 · 选择意向方向（可多选）</span></div>
          <div class="join-step"><b>02</b><span>技术面谈 · 聊经历、聊兴趣，也聊你遇到的问题</span></div>
          <div class="join-step"><b>03</b><span>组内实训 · 老队员带训，从工具与基础开始</span></div>
          <div class="join-step"><b>04</b><span>校内赛上场 · 真机对抗中检验学习成果</span></div>
          <div class="join-step"><b>05</b><span>进入赛季阵容 · 参与正式兵种的研发与迭代</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line" id="growth">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>成长路径</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">从零基础<br />到站上赛场</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            我们不假设你什么都会。下面是大多数队员真实走过的路——
            每一步都有具体的事可做，也都有反馈。
          </p>
        </div>
      </div>

      <div class="growth">
        <div class="growth__row" data-reveal>
          <span class="growth__stage">第一阶段</span>
          <div class="growth__body">
            <h3>认识工具</h3>
            <p>从最基础的开始：看懂一张工程图、跑通第一个点灯程序、装好第一套开发环境。
               目标不是做出来什么，而是知道自己要学什么。</p>
          </div>
          <span class="growth__time">1—2 个月</span>
        </div>
        <div class="growth__row" data-reveal>
          <span class="growth__stage">第二阶段</span>
          <div class="growth__body">
            <h3>接手一个小模块</h3>
            <p>比如一个云台支架、一段电机闭环、一个识别脚本。范围小、责任实，
               做完能装到车上跑，也能被队友使用。</p>
          </div>
          <span class="growth__time">2—4 个月</span>
        </div>
        <div class="growth__row" data-reveal>
          <span class="growth__stage">第三阶段</span>
          <div class="growth__body">
            <h3>进入整机联调</h3>
            <p>开始和别的方向打交道：结构配合电控、视觉配合操作手。
               这个阶段最难的不是技术，是把「我这边没问题」变成「整机没问题」。</p>
          </div>
          <span class="growth__time">赛季周期</span>
        </div>
        <div class="growth__row" data-reveal>
          <span class="growth__stage">第四阶段</span>
          <div class="growth__body">
            <h3>独立负责一个方向</h3>
            <p>从「完成任务」到「定义任务」：自己判断该做什么、怎么验证、
               怎么把方法交给下一个人。这是战队对核心队员的要求。</p>
          </div>
          <span class="growth__time">持续</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="split split--reverse">
        <div class="feature-row" style="grid-template-columns:1fr;gap:1px;background:var(--line);border:1px solid var(--line)">
          <div class="feature" style="border:0;background:var(--ink-800)" data-reveal>
            <span class="feature__k">You get</span>
            <h3>你会得到什么</h3>
            <p>真实的工程环境与设备支持、从零到整的完整项目经验、一群能一起熬夜调车的队友，以及一段足够具体的大学记忆。</p>
          </div>
          <div class="feature" style="border:0;background:var(--ink-800)" data-reveal data-reveal-delay="60">
            <span class="feature__k">We value</span>
            <h3>我们看重什么</h3>
            <p>好奇心、耐心与责任心。能把问题描述清楚、愿意动手验证、不逃避复盘的人，在这里成长得最快。</p>
          </div>
          <div class="feature" style="border:0;background:var(--ink-800)" data-reveal data-reveal-delay="120">
            <span class="feature__k">Time</span>
            <h3>时间投入</h3>
            <p>赛季期间需要稳定的课余投入。我们不要求你放弃生活，但希望你对自己的承诺负责。</p>
          </div>
        </div>
        <div>
          <p class="eyebrow" data-reveal>FAQ</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">常见问题</h2>
          <div class="faq mt-m" id="faq" data-reveal data-reveal-delay="120">
            <details>
              <summary>没有任何基础可以加入吗？</summary>
              <p>可以。战队面向全校招募，绝大多数新队员都是从零开始。入队后有带训环节，从工具使用、基础知识到实际任务逐步推进。</p>
            </details>
            <details>
              <summary>招新只面向特定专业吗？</summary>
              <p>不限专业。机械、电控、视觉、软件与运营五个方向都需要不同背景的同学，跨专业组队恰恰是工程实践的常态。</p>
            </details>
            <details>
              <summary>会占用很多时间吗？</summary>
              <p>赛季冲刺阶段投入会明显增加。日常以课余时间为主，具体节奏与组内安排有关，建议在面谈时直接和对应方向的队员聊清楚。</p>
            </details>
            <details>
              <summary>需要自备电脑或设备吗？</summary>
              <p>日常开发建议自备电脑。加工设备、测试场地与整机硬件由战队与工程实验教学部提供支持。</p>
            </details>
            <details>
              <summary>非大一学生可以加入吗？</summary>
              <p>可以。只要你能保证稳定的投入周期，任何年级都欢迎。高年级同学往往在特定方向上有更深的积累。</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>联系</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">找到我们</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            想先看看我们平时在做什么？战队 B 站账号会持续更新比赛集锦与开发日志。
          </p>
        </div>
      </div>
      <div class="contact-grid" data-reveal>
        <div class="contact">
          <h3>官方视频主页</h3>
          <p>比赛集锦、校内赛记录与开发日志。</p>
          <a class="num" href="https://space.bilibili.com/3546863781283927" target="_blank" rel="noopener">space.bilibili.com/3546863781283927</a>
        </div>
        <div class="contact">
          <h3>战队基地</h3>
          <p>南京邮电大学仙林校区 · 工程实验教学部</p>
          <span class="num">南京市栖霞区文苑路 9 号</span>
        </div>
        <div class="contact">
          <h3>邮件联系</h3>
          <p>官方邮箱与招新咨询邮箱将在招新季公布。</p>
          <span class="num">待补充</span>
        </div>
        <div class="contact">
          <h3>关注后续</h3>
          <p>招新时间、报名表与宣讲安排将同步发布于官方渠道。</p>
          <a class="num" href="results.html">查看战队战绩 →</a>
        </div>
      </div>
    </div>
  </section>

</main>
`;

const galleryBody = `<div class="page">
<main id="main">

  <section class="page-hero" data-watermark="Gallery">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>影像</span>
        </nav>
        <h1 class="h1">影像</h1>
        <p class="lead page-hero__lead">
          赛场、机房与深夜的工位。这里记录战队真实的样子——
          照片由队员随时补充，随时更新。
        </p>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:clamp(36px,4.4vw,64px)">
    <div class="wrap" id="galleryApp">

      <div class="album-strip" id="albumStrip"></div>

      <div class="gallery-bar" id="galleryBar" hidden>
        <div class="gallery-tabs" id="galleryTabs" role="tablist" aria-label="按相册筛选"></div>
        <div class="gallery-bar__count"><b id="galleryCount">0</b> 张照片<span class="gallery-bar__hint"> · 点击放大 · ← → 翻页</span></div>
      </div>

      <div class="gallery-grid" id="galleryGrid"></div>

      <div class="empty" id="galleryEmpty" hidden style="margin-top:24px">
        <p class="js-admin-only">画廊还没有照片。管理员可在 <a class="tlink" href="admin.html">图片管理后台</a> 上传。</p>
        <p class="js-public-only">照片正在整理中，敬请期待。</p>
      </div>
    </div>
  </section>

</main>
`;

const hallBody = `<div class="page">
<main id="main">

  <section class="page-hero hall-hero" data-watermark="Honours">
    <div class="wrap">
      <div class="page-hero__inner">
        <nav class="crumbs" aria-label="面包屑">
          <a href="index.html">首页</a><span>/</span><span>名人堂</span>
        </nav>
        <h1 class="h1">名人堂</h1>
        <p class="lead page-hero__lead">
          这里记录两件事：我们拿过的成绩，以及把成绩做出来的人。
          一块记分牌背后，是无数个在机房里熬过的夜晚。
        </p>
        <div class="hall-hero__stats" id="hallStats"></div>
      </div>
    </div>
  </section>

  <!-- ============ 荣誉墙 ============ -->
  <section class="section" id="honours">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>01 — 荣誉墙</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">每一块奖牌<br />都有具体的日期</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            从第一次站上联盟赛赛场，到首次拿到季军。
            我们更愿意记住过程，但也不会忘记结果。
          </p>
        </div>
      </div>
      <div class="trophy-list" id="trophyList"></div>
      <div class="empty" id="honourEmpty" hidden><p>荣誉记录整理中。</p></div>
    </div>
  </section>

  <!-- ============ 成员档案 ============ -->
  <section class="section section--line" id="members">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <span class="sec-head__index" data-reveal>02 — 成员档案</span>
          <h2 class="h2" data-reveal data-reveal-delay="60">把他们<br />写进档案</h2>
        </div>
        <div class="sec-head__right">
          <p class="lead" data-reveal data-reveal-delay="120">
            按赛季归档的队员名录。每一位参与过设计、装配、调试、
            拍摄与赛事运营的成员，都在这份名单里。
          </p>
        </div>
      </div>

      <div class="hall-filters" id="memberFilters" hidden></div>
      <div class="member-grid" id="memberGrid"></div>

      <div class="archive-empty" id="memberEmpty">
        <div class="archive-empty__grid" aria-hidden="true"></div>
        <div class="archive-empty__body">
          <span class="eyebrow">Archive</span>
          <h3 class="archive-empty__title">档案正在整理中</h3>
          <p class="js-admin-only">
            队员名录由战队自行维护。管理员可在
            <a class="tlink" href="admin.html#members">图片管理后台 · 成员档案</a>
            中录入姓名、赛季、方向与一句话介绍，保存后会立即出现在这里。
          </p>
          <p class="js-public-only">
            这份名录正在整理中。等档案正式公开，你就能在这里看到每一位
            参与过设计、装配、调试与赛事运营的队员。
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 传承 ============ -->
  <section class="section section--line" id="legacy">
    <div class="wrap">
      <div class="split">
        <div>
          <p class="eyebrow" data-reveal>Legacy</p>
          <h2 class="h2 mt-m" data-reveal data-reveal-delay="60">离开的人，<br />留下的是方法</h2>
        </div>
        <div data-reveal data-reveal-delay="120">
          <p class="lead">
            一支学生战队的寿命由学制决定。四年之后，写代码的人会毕业，
            但设计规范、调试文档、踩过的坑与修好的结构会留下来。
          </p>
          <p class="mt-m dim" style="max-width:54ch">
            所以我们把「带训」写进了战队的日常：老队员必须把
            做过的方案整理成能被下一个人接手的文档。
            名人堂记录的是名字，真正被传承的是这些方法与经验。
          </p>
          <div class="team-strip mt-m">
            <span><b>设计评审</b></span><span>文档沉淀</span><span><b>老带新</b></span><span>赛季复盘</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--line">
    <div class="wrap">
      <div class="join-panel" data-reveal>
        <div class="join-panel__grid" aria-hidden="true"></div>
        <div class="join-panel__inner">
          <div>
            <p class="eyebrow">Next Name</p>
            <h2 class="h2" style="margin-top:18px">下一个名字，<br />可能是你</h2>
            <p class="lead" style="margin-top:18px;max-width:42ch">
              这份名单每年都在变长。如果你也想把自己的名字写进来，从这里开始。
            </p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end">
            <a class="btn btn--primary" href="join.html">加入我们<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
            <a class="btn btn--ghost" href="results.html">看战绩</a>
          </div>
        </div>
      </div>
    </div>
  </section>

</main>
<script src="assets/js/hall.js?v=3" defer></script>
`;

const pages = [
  ['about.html', 'about.html', '战队 · POTENTIAL 南京邮电大学机甲大师战队', 'POTENTIAL 战队简介：由南京邮电大学工程实验教学部创建并指导，全流程自研的 RoboMaster 机甲大师战队。技术方向、赛季节奏与组织方式。', aboutBody],
  ['robots.html', 'robots.html', '机甲与团队 · POTENTIAL 南京邮电大学机甲大师战队', 'RoboMaster 七大兵种体系与战队五大技术方向：机械结构、嵌入式电控、视觉算法、软件与仿真、运营宣传。', robotsBody],
  ['hall.html', 'hall.html', '名人堂 · POTENTIAL 南京邮电大学机甲大师战队', 'POTENTIAL 名人堂：战队荣誉墙与成员档案，记录每一个赛季的成绩与把成绩做出来的人。', hallBody],
  ['gallery.html', 'gallery.html', '影像 · POTENTIAL 南京邮电大学机甲大师战队', '战队影像库：赛场、机甲、实验室与团队的比赛与日常记录。', galleryBody],
  ['results.html', 'results.html', '战绩与赛季 · POTENTIAL 南京邮电大学机甲大师战队', 'RoboMaster 2026 机甲大师高校联盟赛（江苏站）季军，创南邮在该项赛事最佳战绩。完整赛季时间线与交手记录。', resultsBody],
  ['join.html', 'join.html', '加入我们 · POTENTIAL 南京邮电大学机甲大师战队', 'POTENTIAL 战队招新：机械、电控、视觉、软件、运营五个方向面向全校招募，无需基础，带训上岗。', joinBody]
];

const band = (items) => `<div class="photo-band" data-reveal>
${items.map(([n, alt, cap], i) => `  <figure class="pband"><img src="assets/img/team/thumbs/${n}.webp" alt="${alt}" width="720" height="480" loading="lazy" decoding="async" /><figcaption><span>${String(i + 1).padStart(2, '0')}</span>${cap}</figcaption></figure>`).join('')}
</div>
`;
const BANDS = {
  'about.html': ['<div class="feature-row">', [['robot-3-side', '三号机器人侧视', '机甲 · 侧视'], ['chassis-bench', '底盘台架调试', '底盘 · 台架调试'], ['sunset-team', '暮色中的队员合影', '队员 · 暮色']]],
  'robots.html': ['<div class="split split--reverse">', [['infantry-front', '步兵机器人正面', '步兵 · 正面'], ['pit-gimbal', '云台特写', '云台 · 特写'], ['armor-led-red', '红方装甲灯条', '装甲灯条 · 红方']]],
  'results.html': ['<div class="feature-row">', [['award-group', '领奖合影', '领奖台 · 合影'], ['shanghai-group', '战队合影', '战队 · 合影'], ['arena-fix', '赛场检修', '赛场 · 检修']]],
  'hall.html': ['<div class="split">', [['award-cert', '获奖证书', '证书 · 荣誉'], ['school-crew', '校园合影', '队员 · 校园'], ['night-lab-group', '夜间实验室合影', '实验室 · 深夜']]],
  'join.html': ['<div class="card-grid">', [['tune-group', '集体调试', '集体 · 调试'], ['debug-crew', '调试小组', '调试小组'], ['field-repair', '场边检修', '场边 · 检修']]]
};
for (const [file, active, title, desc, body0] of pages) {
  let body = body0;
  const bd = BANDS[file];
  if (bd) { const at = body.indexOf(bd[0]); if (at < 0) throw new Error('band marker missing: ' + file); body = body.slice(0, at) + band(bd[1]) + body.slice(at); }
  writeFileSync(pjoin(root, file), page(active, title, desc, body), 'utf8');
  console.log('wrote', file);
}
