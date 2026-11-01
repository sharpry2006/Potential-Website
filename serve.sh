#!/usr/bin/env bash
# POTENTIAL 站点 —— 一键启动
#
#   ./serve.sh              局域网可访问（同一 WiFi 下的手机、平板、电脑都能打开）
#   ./serve.sh 9000         指定端口
#   ./serve.sh --local      仅本机可访问
#
set -euo pipefail

PORT=8080
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --local) ARGS+=("--local") ;;
    ''|*[!0-9]*) ARGS+=("$arg") ;;
    *) PORT="$arg" ;;
  esac
done

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v python3 >/dev/null 2>&1; then
  exec python3 -u "$DIR/tools/serve.py" -p "$PORT" ${ARGS[@]+"${ARGS[@]}"}
elif command -v python >/dev/null 2>&1; then
  exec python -u "$DIR/tools/serve.py" -p "$PORT" ${ARGS[@]+"${ARGS[@]}"}
else
  echo "未找到 python，退回使用 Node 静态服务器…"
  cd "$DIR"
  exec npx --yes http-server -a 0.0.0.0 -p "$PORT" -c-1 .
fi
