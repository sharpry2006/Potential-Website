# POTENTIAL · 南京邮电大学机甲大师战队 — 官网

一个纯静态、零依赖的战队介绍网站。只用 HTML / CSS / 原生 JavaScript，无需构建、无需联网即可运行，
字体、Logo、图片全部本地化。

> 站点内容基于目前可公开查证的资料整理（见下文「资料出处」）。**成员名单、成立年份、
> 招新邮箱等未公开信息没有编造**，对应位置已留出占位或说明，待你提供资料后替换。

---

## 一、怎么打开

### 方式 A：局域网访问（手机 / 平板 / 另一台电脑都能看，推荐）

```bash
cd potential-site
./serve.sh                 # 启动后终端会直接打印可用的网址
```

启动后终端会显示类似：

```
  本机访问    http://127.0.0.1:8080/
  局域网访问  http://192.168.1.237:8080/
  主机名访问  http://king3399.local:8080/   (需设备支持 mDNS)
```

如果在 root 下想用不带端口的域名，可以 `./serve.sh 80`（或用 `python3 tools/serve.py -p 80 -p 8080`
同时监听两个端口），这样手机只要输 `192.168.1.237` 就能打开。
图片后台固定在 `/admin`。

在同一 WiFi 下的任意设备打开「局域网访问」那一行即可。手机上直接输地址或扫码都行
（装了 `qrencode` 的话，脚本会自动在终端打印二维码：`sudo apt install qrencode`）。

其他常用参数：

```bash
./serve.sh 9000            # 换端口
./serve.sh --local         # 仅本机可访问（不暴露到局域网）
```

### 方式 B：只在本机看

```bash
./serve.sh --local
```

### 方式 C：直接双击 `index.html`

也可以（字体、图片、动效均正常），只是地址栏是 `file://`，个别浏览器的
字体跨域策略可能略有差异，推荐用方式 A。

### 网络说明

站点监听 `0.0.0.0`，因此**同一局域网内**的设备都能访问，但**不对公网开放**
（没有端口映射、没有反向代理，家庭/校园 WiFi 之外的设备访问不到）。

打不开时按顺序排查：

1. 两台设备是否连在**同一个** WiFi / 网段（不要在「访客网络」，多数访客网络开了 AP 隔离）。
2. 路由器是否开启了「AP 隔离 / 客户端隔离」——开启时设备之间互不可见，关掉即可。
3. 板子 IP 是否变了：`ip -4 addr show wlan0`。建议在路由器里给它绑定静态 DHCP 租约，
   或直接用 `king3399.local:8080` 这种 mDNS 名字。
4. 端口是否被占用：`ss -ltn | grep 8080`，换端口即可。

### 开机自启（已安装并启用）

站点以 systemd 服务运行，**开机自动启动**，同时监听 80 与 8080：

```bash
systemctl status potential-site     # 查看状态
systemctl restart potential-site    # 改了内容/代码后重启
journalctl -u potential-site -f     # 看访问日志
```

服务文件在 `tools/potential-site.service`（已装到 `/etc/systemd/system/`）。
换机器部署时重复：`sudo cp tools/potential-site.service /etc/systemd/system/ && sudo systemctl enable --now potential-site`。

### 可选：搬到别的机器上跑

整个 `potential-site/` 目录是自包含的（约 2MB，含字体与图片），拷到任何装了 Python 3
的电脑 / 树莓派 / NAS 上，`./serve.sh` 即可；甚至不用服务器，双击 `index.html` 也能看。
便携压缩包：`../potential-site-lan.tar.gz`。

### 体积

| 项目 | 大小 |
| --- | --- |
| 字体（4 个中文子集 + 2 个拉丁） | ~400 KB |
| 图片（9 张 WebP + 缩略图） | ~2.2 MB |
| CSS + JS（未压缩，无第三方库） | ~110 KB |
| 全站 | 约 3 MB（零依赖、零构建、可离线） |

---

## 二、目录结构

```
potential-site/
├── index.html            首页（英雄区 + 简介 + 兵种 + 战绩 + 影像 + 招新）
├── about.html            战队（概况 / 价值观 / 赛季节奏 / 技术方向）
├── robots.html           机甲与团队（七大兵种 / 研发流程 / 开发日志）
├── results.html          战绩与赛季（季军详情 / 时间线 / 交手记录 / 资料来源）
├── gallery.html          影像（照片墙：相册筛选 + 灯箱翻页）
├── hall.html             名人堂（荣誉墙 + 成员档案）
├── admin.html            图片管理后台（上传 / 批量 / 排序 / 相册 / 首页大图）
├── join.html             加入我们（招募方向 / 流程 / FAQ / 联系方式）
├── serve.sh              一键启动（默认局域网可访问）
├── tools/serve.py        静态服务器（仅标准库；关闭目录列表）
├── tools/potential-site.service  可选：systemd 开机自启单元
├── tools/gen.mjs         可选：批量生成内页（含 404 之外的所有页面）
├── tools/build-pages.mjs 生成 GitHub Pages 用的 dist/（剔除后台）
├── .github/workflows/pages.yml  推送即自动部署到 Pages
└── assets/
    ├── css/style.css     全站样式（设计变量集中在文件顶部 :root）
    ├── css/admin.css     后台样式
    ├── data/gallery.json 图片数据（由后台自动读写，别手改也行）
    ├── data/honors.json  名人堂数据（成员 + 荣誉，后台录入）
    ├── img/members/      成员头像
    ├── img/gallery/      上传的图片与缩略图（thumbs/）
    ├── js/site.js        交互：导航、滚动动效、粒子背景、计数器、蓝图描边
    ├── js/gallery.js     画廊渲染（首页轮播 + 照片墙 + 画廊页 + 灯箱）
    ├── js/hall.js        名人堂渲染（荣誉墙 + 成员档案）
    ├── js/palette.js     ⌘K 快速跳转面板
    ├── js/admin.js       后台逻辑（上传、拖拽排序、自动保存）
    ├── fonts/            子集化中文字体 + 拉丁字体（woff2，共约 350KB）
    └── img/
        ├── logo-mark.png     战队 Logo 图形（从官方头像提取，透明背景）
        ├── logo-word*.png    战队 Logo 字标（用于首页大标题）
        ├── logo-red.png      红色版本
        ├── team-avatar.jpg   原始头像备份
        └── media/            B 站视频封面（比赛/开发日志）
```

---

## 三、图片管理（上传 / 排序 / 相册）

### 进入后台

打开 **`http://<板子IP>/admin`**（如 `http://192.168.1.237/admin`），
初始密码 **`potential2026`**，登录后可随时在「相册」面板下方修改密码。
缓存密码保存在 `tools/admin.json`，改完重启也有效。

### 能做什么

| 操作 | 说明 |
| --- | --- |
| 上传 | 拖拽（拖到页面任意位置都行）或点选，**可一次传多张**；服务器自动压缩（长边 ≤ 2000px）、**统一输出 WebP**（同等画质比 JPEG 小约 40%）、生成 900px 缩略图和一张 24px 模糊占位图（先糊后清的加载效果），手机 HEIC 也支持 |
| 归属相册 | 上传时选相册；之后可单张改，或勾选后用「批量移动到…」 |
| 图注 | 每张图下方的输入框，直接改，**自动保存** |
| ★ 精选 | 进**首页「影像集」照片墙** |
| ◉ 首页大图 | 进**首屏轮播**（最多 5 张；都没标记时退回取「精选」，再退回最新） |
| 轮播顺序 | 后台顶部有独立的**「首屏轮播」编辑器**：拖动卡片即可调整播放顺序，点 × 移出，点「添加图片」加入；顺序只影响首页，不影响图库排序 |
| 隐藏 | 图片在网站上不显示，但文件保留 |
| 排序 | **拖动卡片**，顺序即网站上的顺序 |
| 多选批量 | 勾选卡片（或 `Ctrl/⌘ + A` 全选），批量设精选 / 取消 / 设首页大图 / 隐藏 / 显示 / 移动相册 / 删除 |
| 筛选 | 按相册，或按「全部 / 精选 / 已隐藏」过滤 |
| 移除 | 垃圾桶图标或 `Delete` 键：只从图库移除，**磁盘文件保留**，底部出现**撤销**提示（可真正恢复） |
| 永久删除 | 批量条里的「永久删除」才会真的删文件；文件会被移入 `assets/img/gallery/.trash/`，必要时可手动取回 |
| 排序 | 自定义顺序 / 最新优先 / 最早优先 / 按图注；非自定义时禁用拖拽避免误解 |
| 扫描恢复 | 「扫描未入库」把磁盘上存在但未入库的图片一键找回 |
| 相册 | 改名 / 英文名 / 简介 / **封面**（下拉选一张），相册即画廊页的分类卡片 |

所有改动都是**自动保存**的（右上角显示「已保存 / 保存中…」），不需要点保存按钮。
数据写入 `assets/data/gallery.json`，并保留一份 `.bak` 备份。

### 显示逻辑

- **首屏 Hero**：取被标记为「首页大图」的照片（≤5 张，**按后台设定的轮播顺序**）做自动轮播（7 秒一张，
  鼠标移入暂停，色块缩略图可点选）。一张都没有时退回「精选」，再退回最新；
  **一张照片都没有时，整块自动退回原本的工程图纸设计**，不会空掉。
- **首页「影像集」**：被标记「精选」的照片拼成照片墙（首图放大占 2×2），末尾带
  「全部 N 张影像」入口；没有照片时整块隐藏。
- **画廊页 `gallery.html`**：相册封面卡片 + 瀑布流，底部计数；点击放大，
  支持 `←` `→` 翻页、`Home/End` 跳首尾、`Esc` 关闭、手机左右滑动，右上角可下载原图。

> 注意：因为照片是运行时从 `gallery.json` 读取的，**用 `file://` 直接双击打开时画廊不显示**
> （浏览器安全策略禁止本地读 JSON）。用 `./serve.sh` 打开就正常。

### 想手动改也可以

`assets/data/gallery.json` 是纯文本，字段含义：

```json
{
  "albums": [{ "id": "matches", "title": "赛场", "en": "On The Field", "desc": "…", "cover": "" }],
  "images": [{
    "id": "唯一id", "file": "assets/img/gallery/xxx.jpg",
    "thumb": "assets/img/gallery/thumbs/xxx.jpg",
    "album": "matches", "caption": "图注",
    "w": 1920, "h": 1080,
    "featured": true,   // 进首页照片墙
    "hero": true,       // 进首屏轮播
    "heroRank": 0,      // 轮播中的播放顺序（0 在最前）
    "lqip": "data:image/jpeg;base64,...",  // 模糊占位图（上传时自动生成）
    "visible": true,    // false = 网站不显示
    "order": 1, "date": "2026-10-31"
  }]
}
```

直接把照片丢进 `assets/img/gallery/` 再点后台的「扫描未入库」，比手写 JSON 更省事
（会自动补缩略图、尺寸与模糊占位）。

---

## 四、名人堂（成员档案与荣誉墙）

页面：`hall.html`　后台：登录后拉到底部「名人堂」面板。

**录入成员**：切到「成员」页签 → 「新增」→ 填姓名（必填）、花名、赛季、
身份（队长/视觉负责人…）、方向（电控/视觉…）、一句话。**点左侧方块可上传头像**，
没传头像时会用姓氏首字自动生成字母徽章。拖动左侧 `⠿` 可调整顺序。

**录入荣誉**：切到「荣誉」页签 → 「新增」→ 填年份、成绩（如「季军」）、
标题（必填）、赛事、日期、层级（区域赛/全国赛/校内/里程碑）、说明。
荣誉按**排序值**展示（拖动调整），日期只作兜底——所以你可以把最重要的放在最上面。

所有改动输入即保存，保存后刷新名人堂页面就生效。

> 说明：队员姓名、头像这类信息我**没有编造**，档案库初始为空，
> 页面会显示「档案正在整理中」的说明，由你或队员自行录入真实信息。
> 已有的 3 条荣誉（江苏站季军、技术里程碑、上海站首秀）都来自可查证来源。

---

## 五、设计说明

| 项目 | 做法 |
| --- | --- |
| 视觉基调 | 深色石墨底 `#08090c` + 单一强调色「机甲红」`#ff3d2e`，克制、冷峻 |
| 字体 | 中文正文 Noto Sans SC、标题 Noto Serif SC（宋体，编辑感对比），数字与标签 Rajdhani，拉丁 Space Grotesk；全部按实际用字子集化（共 ~570KB） |
| 首页主视觉 | **摄影 Hero**：全屏照片轮播 + 渐变压暗 + 缓慢推近 + 缩略图切换；无照片时自动回退为手绘 SVG「工程图纸」（机器人正视图 + 标注线 + 描述进动效） |
| 动效 | 照片推近与交叉淡入、蓝图描边与扫描线、滚动揭示、卡片聚光、数字滚动、右侧章节导航、跨页过渡（均尊重 `prefers-reduced-motion`；有照片时自动关闭粒子背景以省 CPU） |
| 节奏 | 全宽引文带（用照片做底）打破段落重复，班次式章节序号 + 右侧圆点导航 |
| 快捷跳转 | `⌘K` / `Ctrl+K` 唤起命令面板，可搜索页面、当前页章节与相册，`↑↓` 选择、`↵` 前往；`/` 也能打开 |
| 响应式 | 1440 / 1280 / 1024 / 768 / 375 全断点验证，无横向溢出 |
| 可访问性 | 语义化标签、单 h1、跳过导航链接、键盘焦点样式、图片 alt、抽屉菜单 Esc 关闭 |

改配色只需要动 `assets/css/style.css` 顶部的 `:root`：

```css
--accent: #ff3d2e;   /* 强调色 */
--ink-800: #08090c;  /* 页面底色 */
```

---

## 六、拿到资料后，怎么替换

| 要改的内容 | 位置 |
| --- | --- |
| 首页大标题文案、简介段落 | `index.html` → `.hero__copy` 区块 |
| 首页「季军」等战绩数字 | `index.html` → `.stat-list`（`data-count` 属性控制数字） |
| 兵种卡片 | `index.html` → `.card-grid`；详情在 `robots.html` 的 `.module` |
| 战队信息表 | `about.html` → `.spec-list` |
| 战绩与时间线 | `results.html` → `.result-hero`、`.timeline`、`.matches` |
| 招新流程 / FAQ / 联系方式 | `join.html` → `.join-steps`、`.faq`、`.contact-grid` |
| 视频卡片 | 各页 `.media`，换 `href`（B 站链接）与 `img src` |
| 成员照片 | 放进 `assets/img/media/`，在 `index.html` 新增 `.media` 卡片即可 |

> 目前明确标注为「待补充」的位置：官方邮箱（`join.html` 联系方式区）、招新报名时间与报名表链接。
> 提供后直接替换文字即可。

---

## 七、部署到公网（GitHub Pages）

站点可以免费托管到 GitHub Pages，得到一个 `https://<用户名>.github.io/<仓库名>/` 的地址。

### 关键取舍：后台不能用

GitHub Pages **只托管静态文件，没有后端**。所以：

| | 本地（本机运行） | GitHub Pages |
| --- | --- | --- |
| 网站浏览 | ✅ | ✅ |
| 图片上传 / 改名 / 排序 | ✅ | ❌ |
| 名人堂录入 | ✅ | ❌ |
| ⌘K 搜索、画廊、灯箱 | ✅ | ✅ |

后台相关的提示会自动隐藏（页面会检测有没有后端），不会有坏掉的按钮。

**推荐工作流**：在**本机**用后台整理好照片与档案 → 提交 → 推送 → Pages 自动更新。
站点的内容都在 `assets/data/*.json` 和 `assets/img/` 里，跟着 git 一起走。

### 一次性准备

```bash
cd potential-site
git init -b main
git add .
git commit -m "init: POTENTIAL 官网"
```

在 GitHub 新建一个仓库（**公开**仓库才能免费用 Pages），然后：

```bash
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 开启 Pages

仓库页面 → **Settings → Pages → Build and deployment → Source 选「GitHub Actions」**。
仓库里已经带好 `.github/workflows/pages.yml`，推送后会自动构建并发布（约 1 分钟）。

之后每次 `git push` 都会自动重新部署。

### 构建做了什么

`.github/workflows/pages.yml` 会运行 `node tools/build-pages.mjs`，生成 `dist/`：

- **剔除** `admin.html`、`tools/`、`serve.sh`、`admin.js/admin.css`、备份与回收站
- **补充** `.nojekyll`（防止 Jekyll 处理）、`404.html`（品牌化 404 页）、`robots.txt`
- **自检**：确认产物里没有后台页面残留、没有指向 `/api` 的调用，否则构建失败

本地也可以随时预览构建结果：

```bash
node tools/build-pages.mjs
cd dist && python3 -m http.server 8099      # 打开 http://127.0.0.1:8099/
```

### 想用自己的域名

Settings → Pages → Custom domain 填域名，然后在域名服务商加一条 CNAME 记录指向
`<用户名>.github.io`；勾选 Enforce HTTPS。仓库里也可以放一个 `CNAME` 文件。

### 其它托管选择

- **Cloudflare Pages / Vercel / Netlify**：同样是静态托管，速度更快，构建命令填
  `node tools/build-pages.mjs`，产物目录填 `dist`。
- **如果要保留在线后台**：需要一个能跑 Python 的服务器（VPS、NAS、树莓派都行），
  直接 `./serve.sh` 即可；或者把后台改成纯前端方案（数据存浏览器本地），但那就不再是多设备共享了。

---

## 八、资料出处（可公开查证）

- 南京邮电大学官网新闻《南邮获 RoboMaster 2026 机甲大师高校联盟赛季军》（2026-03-30）
  — 赛事时间地点、季军与「校史最佳」、30 支高校队伍、参赛强队、工程实验教学部创建并指导、
  2026 赛季增设自动化与智能化元素、规则 2025 年 10 月发布。
- RoboMaster 官方 B 站账号赛事视频（RMUL 2026 江苏站 vs 集美大学科来、vs 江南大学 SHARK；
  RMUL 2025 上海站 vs 常州大学 Climber）— 交手记录。
- 战队官方 B 站账号「南邮 Potential 战队」（UID 3546863781283927）
  — 战队口号、Logo、比赛集锦与开发日志（轮腿、飞镖、打样）、校内赛记录。
- 战队技术侧描述（轮腿底盘、飞镖系统、自研电调、快速打样）来自其公开视频标题与简介。

RoboMaster 为大疆创新（DJI）赛事品牌；本页为战队介绍用途，非官方赛事页面。
