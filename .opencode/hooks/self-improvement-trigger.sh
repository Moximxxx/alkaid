#!/bin/bash
# self-improvement-trigger.sh — Trigger the incident-driven improvement loop.

set -euo pipefail

TOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RETRO_LOG="$TOOL_DIR/retros/incident_log.md"
INCIDENT_ANALYZER="$TOOL_DIR/scripts/incident-analyzer.sh"

mkdir -p "$(dirname "$RETRO_LOG")"

if [ ! -f "$RETRO_LOG" ]; then
    cat > "$RETRO_LOG" << 'EOF'
# 事故日志

<!-- 从这里开始记录 -->

EOF
fi

if [ -x "$INCIDENT_ANALYZER" ]; then
    "$INCIDENT_ANALYZER" "$RETRO_LOG" || true
fi

exit 0
