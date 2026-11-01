#!/usr/bin/env python3
"""
POTENTIAL 战队官网 —— 局域网静态服务器 + 图片管理后台
仅使用 Python 标准库（图片压缩调用系统的 ImageMagick convert）。

用法:
    python3 tools/serve.py                    # 局域网可访问，默认端口 8080
    python3 tools/serve.py -p 80 -p 8080      # 同时监听多个端口
    python3 tools/serve.py --local            # 仅本机
    python3 tools/serve.py --no-qr            # 不打印二维码

后台管理:  http://<本机IP>/admin
"""
import argparse
import hashlib
import hmac
import json
import mimetypes
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import uuid
import http.server
import socketserver
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(ROOT, "assets", "img", "gallery")
THUMB_DIR = os.path.join(GALLERY_DIR, "thumbs")
DATA_FILE = os.path.join(ROOT, "assets", "data", "gallery.json")
HONORS_FILE = os.path.join(ROOT, "assets", "data", "honors.json")
MEMBER_DIR = os.path.join(ROOT, "assets", "img", "members")
ADMIN_CONF = os.path.join(ROOT, "tools", "admin.json")

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".gif", ".bmp", ".tif", ".tiff"}
MAX_UPLOAD = 120 * 1024 * 1024
MAX_IMAGE_SIDE = 2000
THUMB_SIDE = 900
COOKIE_NAME = "pt_admin"

DEFAULT_ALBUMS = [
    {"id": "matches", "title": "赛场", "en": "On The Field", "desc": "比赛现场的对抗、调试与领奖时刻。", "cover": ""},
    {"id": "robots", "title": "机甲", "en": "Machines", "desc": "兵种特写、结构细节与装配过程。", "cover": ""},
    {"id": "lab", "title": "实验室", "en": "Workshop", "desc": "打样、装配、调试与深夜的工位。", "cover": ""},
    {"id": "team", "title": "团队", "en": "Crew", "desc": "队员、合影与那些赛场之外的日子。", "cover": ""},
]

_write_lock = threading.Lock()


# --------------------------------------------------------------------------- utils
def ensure_dirs():
    os.makedirs(GALLERY_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)


def load_state():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}
    albums = data.get("albums") or DEFAULT_ALBUMS
    images = data.get("images") or []
    if not isinstance(albums, list) or not albums:
        albums = DEFAULT_ALBUMS
    for a in albums:
        a.setdefault("id", uuid.uuid4().hex[:8])
        a.setdefault("title", "未命名相册")
        a.setdefault("en", "")
        a.setdefault("desc", "")
    return {"albums": albums, "images": images}


def save_state(state):
    ensure_dirs()
    with _write_lock:
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        if os.path.exists(DATA_FILE):
            try:
                shutil.copyfile(DATA_FILE, DATA_FILE + ".bak")
            except Exception:
                pass
        os.replace(tmp, DATA_FILE)


DATA_FILES = {"honors": HONORS_FILE}

DEFAULT_HONORS = {"members": [], "honors": []}


def load_named(name):
    if name not in DATA_FILES:
        raise ValueError("未知数据文件")
    path = DATA_FILES[name]
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}
    if not isinstance(data, dict):
        data = {}
    for key in ("members", "honors"):
        if not isinstance(data.get(key), list):
            data[key] = []
    return data


def save_named(name, data):
    if name not in DATA_FILES:
        raise ValueError("未知数据文件")
    path = DATA_FILES[name]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with _write_lock:
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        if os.path.exists(path):
            try:
                shutil.copyfile(path, path + ".bak")
            except Exception:
                pass
        os.replace(tmp, path)


def safe_member_path(rel):
    if not rel:
        return None
    rel = str(rel).replace("\\", "/").lstrip("/")
    if ".." in rel:
        return None
    full = os.path.normpath(os.path.join(ROOT, rel))
    if not full.startswith(MEMBER_DIR + os.sep):
        return None
    return full


def admin_password():
    if os.path.exists(ADMIN_CONF):
        try:
            with open(ADMIN_CONF, "r", encoding="utf-8") as f:
                pw = json.load(f).get("password")
            if pw:
                return str(pw)
        except Exception:
            pass
    pw = "potential2026"
    os.makedirs(os.path.dirname(ADMIN_CONF), exist_ok=True)
    with open(ADMIN_CONF, "w", encoding="utf-8") as f:
        json.dump({"password": pw}, f, ensure_ascii=False, indent=2)
    return pw


def token_for(pw):
    return hmac.new(b"potential-gallery", pw.encode("utf-8"), hashlib.sha256).hexdigest()


def convert_bin():
    return "convert" if shutil.which("convert") else "magick"


def have_convert():
    return shutil.which("convert") is not None or shutil.which("magick") is not None


def run(cmd):
    return subprocess.run(cmd, capture_output=True, timeout=180)


def slugify(name):
    base = os.path.splitext(os.path.basename(name))[0]
    base = re.sub(r"[^\w\u4e00-\u9fa5-]+", "-", base).strip("-").lower()
    base = base[:40] or "image"
    return base


def probe_image(path):
    try:
        out = run([convert_bin(), path, "-format", "%w %h %[opaque]", "info:"]).stdout.decode()
        w, h, opaque = out.split()
        return int(w), int(h), opaque.strip().lower() != "true"
    except Exception:
        return 0, 0, False


def process_image(src_bytes, orig_name):
    ensure_dirs()
    ext = os.path.splitext(orig_name)[1].lower()
    if ext not in ALLOWED_EXT:
        raise ValueError("不支持的图片格式：%s" % ext)

    uid = uuid.uuid4().hex[:10]
    stem = "%s-%s" % (slugify(orig_name), uid)

    fd, tmp_in = tempfile.mkstemp(suffix=ext)
    os.close(fd)
    with open(tmp_in, "wb") as f:
        f.write(src_bytes)

    try:
        if ext == ".gif":
            out_name = stem + ".gif"
            out_path = os.path.join(GALLERY_DIR, out_name)
            shutil.copyfile(tmp_in, out_path)
            thumb_name = stem + ".gif"
            shutil.copyfile(tmp_in, os.path.join(THUMB_DIR, thumb_name))
            w, h, _ = probe_image(out_path)
        else:
            w, h, alpha = probe_image(tmp_in)
            # 统一输出 WebP：同等画质下体积约为 JPEG 的 55%~65%
            out_ext = ".webp"
            out_name = stem + out_ext
            out_path = os.path.join(GALLERY_DIR, out_name)
            base_cmd = [convert_bin(), tmp_in, "-auto-orient",
                        "-resize", "%dx%d>" % (MAX_IMAGE_SIDE, MAX_IMAGE_SIDE)]
            run(base_cmd + ["-strip", "-quality", "84", "-define", "webp:method=6", out_path])
            thumb_name = stem + out_ext
            run([convert_bin(), out_path, "-resize", "%dx%d>" % (THUMB_SIDE, THUMB_SIDE),
                 "-strip", "-quality", "78", "-define", "webp:method=4",
                 os.path.join(THUMB_DIR, thumb_name)])
            w, h, _ = probe_image(out_path)
    finally:
        try:
            os.unlink(tmp_in)
        except Exception:
            pass

    lqip = make_lqip(os.path.join(GALLERY_DIR, out_name))

    return ("assets/img/gallery/" + out_name,
            "assets/img/gallery/thumbs/" + thumb_name,
            w, h, lqip)


def process_member_avatar(src_bytes, orig_name):
    """成员头像：裁成正方形、缩放并输出 WebP。"""
    os.makedirs(MEMBER_DIR, exist_ok=True)
    ext = os.path.splitext(orig_name)[1].lower() or ".jpg"
    fd, tmp_in = tempfile.mkstemp(suffix=ext)
    os.close(fd)
    with open(tmp_in, "wb") as f:
        f.write(src_bytes)
    try:
        name = "%s-%s.webp" % (slugify(orig_name)[:24], uuid.uuid4().hex[:8])
        out = os.path.join(MEMBER_DIR, name)
        run([convert_bin(), tmp_in, "-auto-orient", "-gravity", "center",
             "-resize", "480x480^", "-extent", "480x480",
             "-strip", "-quality", "82", "-define", "webp:method=5", out])
    finally:
        try:
            os.unlink(tmp_in)
        except Exception:
            pass
    return "assets/img/members/" + name


def make_lqip(path, width=24):
    """生成极小的模糊占位图，内联成 data URI，用于图片「先糊后清」的加载效果。"""
    try:
        fd, tmp = tempfile.mkstemp(suffix=".webp")
        os.close(fd)
        run([convert_bin(), path, "-resize", "%dx" % width, "-blur", "0x1.4",
             "-strip", "-quality", "45", tmp])
        with open(tmp, "rb") as f:
            raw = f.read()
        os.unlink(tmp)
        import base64
        return "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")
    except Exception:
        return ""


def parse_multipart(body, boundary):
    out = []
    delim = b"--" + boundary
    for seg in body.split(delim):
        if not seg or seg.startswith(b"--"):
            continue
        seg = seg.lstrip(b"\r\n")
        head, _, data = seg.partition(b"\r\n\r\n")
        if data.endswith(b"\r\n"):
            data = data[:-2]
        headers = {}
        for line in head.split(b"\r\n"):
            if b":" in line:
                k, v = line.split(b":", 1)
                headers[k.strip().lower().decode("latin-1")] = v.strip().decode("latin-1")
        disp = headers.get("content-disposition", "")
        name_m = re.search(r'name="([^"]*)"', disp)
        file_m = re.search(r'filename="([^"]*)"', disp)
        out.append((name_m.group(1) if name_m else "",
                    file_m.group(1) if file_m else None, data))
    return out


def safe_gallery_path(rel):
    if not rel:
        return None
    rel = str(rel).replace("\\", "/").lstrip("/")
    if ".." in rel:
        return None
    full = os.path.normpath(os.path.join(ROOT, rel))
    if not (full.startswith(GALLERY_DIR + os.sep) or full == GALLERY_DIR):
        return None
    return full


# --------------------------------------------------------------------------- handler
class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "PotentialSite/1.1"

    # ---------- helpers
    def _json(self, payload, status=200, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra_headers or []):
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length > MAX_UPLOAD:
            raise ValueError("请求体过大")
        return self.rfile.read(length) if length else b""

    def _is_admin(self):
        pw = admin_password()
        cookie = self.headers.get("Cookie") or ""
        for part in cookie.split(";"):
            if "=" in part:
                k, v = part.strip().split("=", 1)
                if k == COOKIE_NAME and hmac.compare_digest(v, token_for(pw)):
                    return True
        supplied = self.headers.get("X-Admin-Password")
        if supplied:
            return hmac.compare_digest(supplied, pw)
        return False

    def _require_admin(self):
        if not self._is_admin():
            self._json({"ok": False, "error": "未登录"}, 401)
            return False
        return True

    def _cookie_header(self, value, max_age):
        return ("Set-Cookie", "%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax"
                % (COOKIE_NAME, value, max_age))

    # ---------- routing
    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/admin", "/admin/"):
            return self._serve_file("admin.html")
        if path == "/api/state":
            return self._json(load_state())
        if path == "/api/honors":
            return self._json(load_named("honors"))
        if path == "/api/session":
            return self._json({"ok": True, "admin": self._is_admin()})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/login":
                return self._login()
            if path == "/api/logout":
                return self._json({"ok": True}, extra_headers=[self._cookie_header("", 0)])
            if path == "/api/upload":
                return self._upload()
            if path == "/api/save":
                return self._save()
            if path == "/api/delete":
                return self._delete()
            if path == "/api/scan":
                return self._scan()
            if path == "/api/password":
                return self._change_password()
            if path == "/api/honors":
                return self._save_honors()
        except ValueError as e:
            return self._json({"ok": False, "error": str(e)}, 400)
        except Exception as e:
            return self._json({"ok": False, "error": "服务器错误：%s" % e}, 500)
        return self._json({"ok": False, "error": "not found"}, 404)

    def _serve_file(self, rel):
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            return self.send_error(404)
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type",
                         ctype + ("; charset=utf-8" if ctype.startswith("text/") else ""))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    # ---------- api actions
    def _login(self):
        data = json.loads(self._read_body() or b"{}")
        pw = admin_password()
        if not hmac.compare_digest(str(data.get("password", "")), pw):
            time.sleep(0.6)
            return self._json({"ok": False, "error": "密码不正确"}, 401)
        return self._json({"ok": True},
                          extra_headers=[self._cookie_header(token_for(pw), 60 * 60 * 24 * 30)])

    def _scan(self):
        """扫描 gallery 目录，找出未入库的图片文件；带 import 参数时重新入库。"""
        if not self._require_admin():
            return
        data = json.loads(self._read_body() or b"{}")
        do_import = bool(data.get("import"))

        ensure_dirs()
        state = load_state()
        used = set()
        for img in state["images"]:
            used.add(os.path.basename(img.get("file") or ""))
            used.add(os.path.basename(img.get("thumb") or ""))

        version = "v1"
        if do_import:
            try:
                out = json.loads(open(os.path.join(ROOT, "assets", "data", "version.json")).read())
                version = out.get("version", "v1")
            except Exception:
                pass

        found = []
        for name in sorted(os.listdir(GALLERY_DIR)):
            full = os.path.join(GALLERY_DIR, name)
            if not os.path.isfile(full) or name in used or name.startswith("."):
                continue
            if os.path.splitext(name)[1].lower() not in ALLOWED_EXT:
                continue
            found.append(name)

        imported = 0
        if do_import:
            album = state["albums"][0]["id"] if state["albums"] else "matches"
            for name in found:
                full = os.path.join(GALLERY_DIR, name)
                thumb_path = os.path.join(THUMB_DIR, name)
                if not os.path.exists(thumb_path):
                    run([convert_bin(), full, "-resize", "%dx%d>" % (THUMB_SIDE, THUMB_SIDE),
                         "-strip", "-quality", "82", thumb_path])
                w, h, _ = probe_image(full)
                state["images"].append({
                    "id": uuid.uuid4().hex[:12],
                    "file": "assets/img/gallery/" + name,
                    "thumb": "assets/img/gallery/thumbs/" + name,
                    "lqip": make_lqip(full),
                    "hero": False,
                    "heroRank": 0,
                    "album": album,
                    "caption": os.path.splitext(name)[0][:60],
                    "w": w, "h": h,
                    "featured": False, "visible": True,
                    "date": time.strftime("%Y-%m-%d"),
                    "order": int(os.path.getmtime(full) * 1000),
                })
                imported += 1
            if imported:
                save_state(state)

        return self._json({"ok": True, "found": found, "imported": imported,
                           "state": state if do_import else None})

    def _change_password(self):
        if not self._require_admin():
            return
        data = json.loads(self._read_body() or b"{}")
        new = str(data.get("password") or "").strip()
        if len(new) < 6:
            return self._json({"ok": False, "error": "密码至少 6 位"}, 400)
        with open(ADMIN_CONF, "w", encoding="utf-8") as f:
            json.dump({"password": new}, f, ensure_ascii=False, indent=2)
        return self._json({"ok": True},
                          extra_headers=[self._cookie_header(token_for(new), 60 * 60 * 24 * 30)])

    def _upload(self):
        if not self._require_admin():
            return
        if not have_convert():
            return self._json({"ok": False, "error": "服务器缺少 ImageMagick，无法处理图片"}, 500)
        ctype = self.headers.get("Content-Type") or ""
        m = re.search(r"boundary=([^;]+)", ctype)
        if "multipart/form-data" not in ctype or not m:
            return self._json({"ok": False, "error": "请使用 multipart/form-data 上传"}, 400)
        boundary = m.group(1).strip().strip('"').encode()

        parts = parse_multipart(self._read_body(), boundary)

        album = ""
        target = "gallery"
        added = []
        errors = []
        for name, filename, data in parts:
            if not filename:
                if name == "album":
                    album = data.decode("utf-8", "replace").strip()
                elif name == "target":
                    target = data.decode("utf-8", "replace").strip() or "gallery"
                continue
            if not data:
                continue
            try:
                if target == "members":
                    path = process_member_avatar(data, filename)
                    added.append({"file": path})
                    continue
                main, thumb, w, h, lqip = process_image(data, filename)
                added.append({
                    "id": uuid.uuid4().hex[:12],
                    "file": main,
                    "thumb": thumb,
                    "lqip": lqip,
                    "hero": False,
                    "heroRank": 0,
                    "album": album or "matches",
                    "caption": os.path.splitext(os.path.basename(filename))[0][:60],
                    "w": w,
                    "h": h,
                    "featured": False,
                    "visible": True,
                    "date": time.strftime("%Y-%m-%d"),
                    "order": int(time.time() * 1000),
                })
            except Exception as e:
                errors.append("%s：%s" % (filename, e))

        if target == "members":
            return self._json({"ok": True, "files": added, "errors": errors})

        state = load_state()
        album_ids = {a.get("id") for a in state["albums"]}
        if album and album not in album_ids:
            album = state["albums"][0]["id"]
        for item in added:
            item["album"] = album or state["albums"][0]["id"]
        state["images"] = state["images"] + added
        save_state(state)
        return self._json({"ok": True, "state": state, "added": len(added), "errors": errors})

    def _save(self):
        if not self._require_admin():
            return
        data = json.loads(self._read_body() or b"{}")
        state = load_state()

        albums = data.get("albums")
        if isinstance(albums, list):
            cleaned = []
            for a in albums:
                if not isinstance(a, dict):
                    continue
                cleaned.append({
                    "id": str(a.get("id") or uuid.uuid4().hex[:8]),
                    "title": str(a.get("title") or "未命名相册")[:40],
                    "en": str(a.get("en") or "")[:40],
                    "desc": str(a.get("desc") or "")[:200],
                    "cover": str(a.get("cover") or "")[:200],
                })
            if cleaned:
                state["albums"] = cleaned

        images = data.get("images")
        if isinstance(images, list):
            album_ids = {a["id"] for a in state["albums"]}
            cleaned = []
            for i, img in enumerate(images):
                if not isinstance(img, dict):
                    continue
                main = safe_gallery_path(img.get("file"))
                thumb = safe_gallery_path(img.get("thumb"))
                if not main or not os.path.exists(main):
                    continue
                cleaned.append({
                    "id": str(img.get("id") or uuid.uuid4().hex[:12]),
                    "file": img["file"],
                    "thumb": img.get("thumb") if thumb and os.path.exists(thumb) else img["file"],
                    "album": img.get("album") if img.get("album") in album_ids else state["albums"][0]["id"],
                    "caption": str(img.get("caption") or "")[:120],
                    "w": int(img.get("w") or 0),
                    "h": int(img.get("h") or 0),
                    "featured": bool(img.get("featured")),
                    "hero": bool(img.get("hero")),
                    "heroRank": int(img.get("heroRank") or 0),
                    "lqip": str(img.get("lqip") or "")[:8000],
                    "visible": bool(img.get("visible", True)),
                    "date": str(img.get("date") or time.strftime("%Y-%m-%d"))[:20],
                    "order": int(img.get("order") or i),
                })
            state["images"] = cleaned

        save_state(state)
        return self._json({"ok": True, "state": state})

    def _save_honors(self):
        if not self._require_admin():
            return
        data = json.loads(self._read_body() or b"{}")
        state = load_named("honors")

        members = data.get("members")
        if isinstance(members, list):
            cleaned = []
            for i, m in enumerate(members):
                if not isinstance(m, dict):
                    continue
                name = str(m.get("name") or "").strip()[:24]
                if not name:
                    continue  # 没名字的条目丢弃
                cleaned.append({
                    "id": str(m.get("id") or uuid.uuid4().hex[:10]),
                    "name": name,
                    "nick": str(m.get("nick") or "")[:24],
                    "season": str(m.get("season") or "")[:20],
                    "role": str(m.get("role") or "")[:24],
                    "direction": str(m.get("direction") or "")[:24],
                    "note": str(m.get("note") or "")[:160],
                    "avatar": str(m.get("avatar") or "")[:200],
                    "order": int(m.get("order") or i),
                    "visible": bool(m.get("visible", True)),
                })
            state["members"] = cleaned

        honors = data.get("honors")
        if isinstance(honors, list):
            cleaned = []
            for i, h in enumerate(honors):
                if not isinstance(h, dict):
                    continue
                title = str(h.get("title") or "").strip()[:80]
                if not title:
                    continue
                cleaned.append({
                    "id": str(h.get("id") or uuid.uuid4().hex[:10]),
                    "year": str(h.get("year") or "")[:10],
                    "event": str(h.get("event") or "")[:80],
                    "title": title,
                    "result": str(h.get("result") or "")[:24],
                    "level": str(h.get("level") or "")[:16],
                    "note": str(h.get("note") or "")[:200],
                    "date": str(h.get("date") or "")[:20],
                    "order": int(h.get("order") or i),
                    "visible": bool(h.get("visible", True)),
                })
            state["honors"] = cleaned

        save_named("honors", state)
        return self._json({"ok": True, "state": state})

    def _delete(self):
        if not self._require_admin():
            return
        data = json.loads(self._read_body() or b"{}")
        target_id = data.get("id")
        state = load_state()
        keep, removed = [], None
        for img in state["images"]:
            if img.get("id") == target_id:
                removed = img
            else:
                keep.append(img)
        if removed:
            state["images"] = keep
            save_state(state)
            if data.get("purge"):
                # 永久删除：文件移入 .trash（而非直接抹掉），需要时可人工取回
                trash = os.path.join(GALLERY_DIR, ".trash")
                os.makedirs(trash, exist_ok=True)
                for key in ("file", "thumb"):
                    full = safe_gallery_path(removed.get(key))
                    if full and os.path.exists(full):
                        try:
                            shutil.move(full, os.path.join(trash, os.path.basename(full)))
                        except Exception:
                            pass
        return self._json({"ok": True, "state": state})

    # ---------- 静态服务细节
    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None

    def end_headers(self):
        p = urlparse(self.path).path
        if p.startswith("/assets/img/") or p.startswith("/assets/fonts/"):
            # 图片与字体内容不会原地变化（重传会生成新文件名），可长缓存
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            # CSS / JS / HTML 每次向服务器校验，改完刷新即生效
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        msg = fmt % args
        if "favicon" in msg or "/assets/" in msg:
            return
        sys.stderr.write("  %s\n" % msg)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def local_ips():
    ips = []
    try:
        out = subprocess.run(["ip", "-4", "-o", "addr", "show", "scope", "global"],
                             capture_output=True, text=True, timeout=3).stdout
        for line in out.splitlines():
            parts = line.split()
            if "inet" in parts:
                ip = parts[parts.index("inet") + 1].split("/")[0]
                if ip not in ips:
                    ips.append(ip)
    except Exception:
        pass
    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("192.168.1.1", 80))
            ips.append(s.getsockname()[0])
            s.close()
        except Exception:
            pass
    return ips


def print_qr(url, disabled=False):
    if disabled or not shutil.which("qrencode"):
        return
    subprocess.run(["qrencode", "-t", "ANSIUTF8", "-m", "1", url], check=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", "--port", type=int, action="append", help="可重复指定多个端口")
    ap.add_argument("--local", action="store_true", help="仅监听本机回环地址")
    ap.add_argument("--no-qr", action="store_true", help="不打印二维码")
    args = ap.parse_args()

    ports = args.port or [8080]
    host = "127.0.0.1" if args.local else "0.0.0.0"
    os.chdir(ROOT)
    ensure_dirs()
    if not os.path.exists(DATA_FILE):
        save_state({"albums": DEFAULT_ALBUMS, "images": []})
    pw = admin_password()

    servers = []
    for port in ports:
        try:
            servers.append((port, Server((host, port), Handler)))
        except OSError as e:
            print("! 端口 %d 无法监听：%s" % (port, e), flush=True)

    if not servers:
        sys.exit("没有可用端口，换个端口试试：-p 9000")

    bar = "-" * 60
    print("\n%s\n  POTENTIAL · 南京邮电大学机甲大师战队 —— 站点已启动\n%s" % (bar, bar), flush=True)
    ips = [] if args.local else local_ips()
    for port, _ in servers:
        print("  本机访问    http://127.0.0.1:%d/" % port, flush=True)
    for ip in ips:
        for port, _ in servers:
            print("  局域网访问  http://%s:%d/" % (ip, port), flush=True)
    if ips and socket.gethostname():
        print("  主机名访问  http://%s.local:%d/" % (socket.gethostname(), servers[0][0]), flush=True)
    print(bar, flush=True)
    print("  图片后台    http://%s:%d/admin   （初始密码：%s）"
          % (ips[0] if ips else "127.0.0.1", servers[0][0], pw), flush=True)
    print("  密码可在后台修改，保存在 tools/admin.json", flush=True)
    print("%s\n  按 Ctrl+C 停止\n" % bar, flush=True)

    if ips and not args.local:
        print_qr("http://%s:%d/" % (ips[0], servers[0][0]), args.no_qr)

    for port, srv in servers[1:]:
        threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        servers[0][1].serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
        for _, srv in servers:
            srv.server_close()


if __name__ == "__main__":
    main()
