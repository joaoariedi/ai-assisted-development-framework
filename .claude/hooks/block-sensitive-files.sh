#!/bin/bash
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

FILENAME=$(basename "$FILE_PATH")
DIRPATH=$(dirname "$FILE_PATH")

# Block .env files
if [[ "$FILENAME" == .env* ]]; then
  echo "Blocked: $FILE_PATH is a sensitive .env file. Requires explicit user approval." >&2
  exit 2
fi

# Block key/cert files
if [[ "$FILE_PATH" == *.key ]] || \
   [[ "$FILE_PATH" == *.pem ]] || \
   [[ "$FILE_PATH" == *.p12 ]] || \
   [[ "$FILE_PATH" == *.pfx ]] || \
   [[ "$FILE_PATH" == *.secret ]]; then
  echo "Blocked: $FILE_PATH is a sensitive key/cert file. Requires explicit user approval." >&2
  exit 2
fi

# Block credentials files
if [[ "$FILENAME" == credentials* ]]; then
  echo "Blocked: $FILE_PATH is a credentials file. Requires explicit user approval." >&2
  exit 2
fi

# Block .git internals
if [[ "$FILE_PATH" == */.git/* ]]; then
  echo "Blocked: $FILE_PATH is a git internal file. Do not modify directly." >&2
  exit 2
fi

# Block secrets directories
if [[ "$DIRPATH" == */secrets/* ]] || [[ "$DIRPATH" == */secrets ]] || \
   [[ "$DIRPATH" == */.secrets/* ]] || [[ "$DIRPATH" == */.secrets ]]; then
  echo "Blocked: $FILE_PATH is in a secrets directory. Requires explicit user approval." >&2
  exit 2
fi

exit 0
