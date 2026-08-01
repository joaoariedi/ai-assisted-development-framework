#!/bin/bash
set -euo pipefail

# PreToolUse gate on Bash: hard denials for destructive commands.
#
# llm-security.md has always SAID "never run push --force / reset --hard / branch -D
# without explicit user request" — but prose is guidance the model can rationalize past,
# and the framework's own thesis (Defense in Depth) is that prompting is not a mechanism.
# This hook is the mechanism. Pattern borrowed from YC's QM harness, whose command policy
# hard-denies recursive deletes in every security posture.
#
# Threat model: a CARELESS or prompt-injected agent typing the destructive command in its
# obvious form. It is not a sandbox — a determined adversary can compose around a string
# match (bash -c, variables). That evasion is visible in the transcript, which is the
# same auditability bet CLAUDE_SKIP_VERIFY_GATE makes.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

# Visible, auditable bypass for when the USER explicitly requested the command — the
# "explicit user request" clause of llm-security.md, made mechanical. The prefix lives in
# the command string, so using it is always on the record. Mirrors CLAUDE_SKIP_VERIFY_GATE.
if [[ "$CMD" == *"CLAUDE_ALLOW_DESTRUCTIVE=1"* ]]; then
  exit 0
fi

deny() {
  echo "Blocked: $1" >&2
  echo "This is a hard denial (block-destructive-commands.sh). If the user explicitly asked for this exact command, re-run it prefixed with CLAUDE_ALLOW_DESTRUCTIVE=1 — the bypass stays visible in the transcript. Otherwise ask the user first." >&2
  exit 2
}

# Heredoc bodies are data, but sed's quote-stripping below is line-based and cannot see a
# quote span that crosses lines — so a commit-message heredoc mentioning "git reset --hard"
# was denied (measured, not imagined: this repo's own commit style is `-m "$(cat <<'EOF'`).
# Drop everything between a `<<WORD` opener and the WORD terminator line before analysing.
CMD=$(printf '%s\n' "$CMD" | awk '
  h { if ($0 == term) h = 0; next }
  match($0, /<<-?[[:space:]]*["'\'']?[A-Za-z_][A-Za-z0-9_]*/) {
    term = substr($0, RSTART, RLENGTH)
    sub(/<<-?[[:space:]]*["'\'']?/, "", term)
    h = 1; print; next
  }
  { print }')

# Two-step normalisation, order load-bearing:
#   1. UNQUOTE whitespace-free quoted tokens — "$HOME" must stay matchable as a target.
#   2. DELETE remaining quoted spans — they contain whitespace, i.e. prose. Without this,
#      `git commit -m "docs: never git reset --hard"` is denied: data read as command.
#      (Committing THIS feature would trip its own hook — that false positive is real.)
NORM=$(printf '%s' "$CMD" | sed -E \
  -e 's/"([^"[:space:]]*)"/\1/g' \
  -e "s/'([^'[:space:]]*)'/\1/g" \
  -e 's/"[^"]*"//g' \
  -e "s/'[^']*'//g")

has_word() { [[ "$1" =~ (^|[[:space:]])$2([[:space:]]|$) ]]; }

check_git_segment() {
  local seg="$1"
  has_word "$seg" "git" || return 0
  if has_word "$seg" "push"; then
    # --force-with-lease is the SAFE variant — strip it before looking for --force, or
    # the safe form is denied by its own prefix. `+refspec` is force-push in disguise.
    local no_lease="${seg//--force-with-lease/}"
    if has_word "$no_lease" "-f" || has_word "$no_lease" "--force"; then
      deny "'git push --force' rewrites remote history. Use --force-with-lease, or get explicit user approval."
    fi
    if [[ "$seg" =~ (^|[[:space:]])\+[^[:space:]]+ ]]; then
      deny "'git push' with a +refspec is a force push. Use --force-with-lease, or get explicit user approval."
    fi
  fi
  if has_word "$seg" "reset" && has_word "$seg" "--hard"; then
    deny "'git reset --hard' discards uncommitted work irrecoverably."
  fi
  if has_word "$seg" "branch"; then
    if has_word "$seg" "-D" || { { has_word "$seg" "-d" || has_word "$seg" "--delete"; } && { has_word "$seg" "-f" || has_word "$seg" "--force"; }; }; then
      deny "'git branch -D' deletes a branch regardless of merge state. Use -d, or get explicit user approval."
    fi
  fi
  if has_word "$seg" "clean"; then
    if [[ "$seg" =~ (^|[[:space:]])-[a-zA-Z]*f[a-zA-Z]*([[:space:]]|$) ]] || has_word "$seg" "--force"; then
      deny "'git clean -f' deletes untracked files irrecoverably. Preview with 'git clean -n', or get explicit user approval."
    fi
  fi
}

check_rm_segment() {
  local seg="$1"
  [[ "$seg" =~ (^|[[:space:]])(sudo[[:space:]]+)?rm[[:space:]] ]] || return 0
  if [[ "$seg" =~ (^|[[:space:]])-[a-zA-Z]*[rR][a-zA-Z]*([[:space:]]|$) ]] || has_word "$seg" "--recursive"; then
    # Catastrophic targets only: root, home, cwd/parent wholesale, glob-all, repo history.
    # A bare "$VAR" target was considered and rejected: empty expansion makes rm a no-op
    # ("" is an error, not /) — the noise would outweigh the protection.
    if [[ "$seg" =~ (^|[[:space:]])(/|/\*|~|~/|~/\*|\$HOME(/\*?)?|\$\{HOME\}(/\*?)?|\.|\.\.|\./|\.\./|\.git/?|\*)([[:space:]]|$) ]]; then
      deny "recursive rm of a catastrophic target (/, ~, ., .., *, or .git). Name the specific subdirectory instead."
    fi
  fi
}

# Split compound commands so `cd /tmp && rm -rf /` is judged per segment, and a
# destructive command cannot hide behind a benign first half.
SEGMENTS=$(printf '%s\n' "$NORM" | awk '{gsub(/[;&|]+/, "\n")} 1')
while IFS= read -r seg; do
  check_git_segment "$seg"
  check_rm_segment "$seg"
done <<<"$SEGMENTS"

exit 0
