#!/bin/bash
set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ -z "$CWD" ]; then
  exit 0
fi

# Skip non-project directories (e.g. home dir without a project marker)
if [ "$CWD" = "$HOME" ] || [ "$CWD" = "/" ]; then
  exit 0
fi

# Check if any source files were recently modified (last 60 seconds)
# This approximates "did Claude edit code during this turn"
RECENT_EDITS=$(find "$CWD" -maxdepth 5 \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -o -name "*.py" -o -name "*.rs" -o -name "*.go" \) \
  2>/dev/null | while read -r f; do
    if [ -f "$f" ]; then
      MTIME=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo 0)
      NOW=$(date +%s)
      if [ $((NOW - MTIME)) -lt 60 ]; then
        echo "$f"
      fi
    fi
  done | head -1)

if [ -z "$RECENT_EDITS" ]; then
  exit 0
fi

# Check if tests were run recently (within last 60 seconds)
STAMP_FILE="/tmp/.claude-test-stamp-$(echo "$CWD" | md5sum | cut -d' ' -f1)"
if [ -f "$STAMP_FILE" ]; then
  LAST_RUN=$(cat "$STAMP_FILE")
  NOW=$(date +%s)
  ELAPSED=$((NOW - LAST_RUN))
  if [ "$ELAPSED" -lt 60 ]; then
    exit 0
  fi
fi

# Source files were edited but tests weren't run
echo "Reminder: source files were modified but tests haven't been run this turn."

exit 0
