#!/usr/bin/env bash
#
# Smoke test for the plugin itself.
#
# This framework's recurring failure mode is a component that validates cleanly and
# never runs: the plugin installs, `claude plugin list` says enabled, and every command
# is dead. Four consecutive commits on main were fixes of exactly that shape. A linter or
# a JSON-schema check would have passed all four.
#
# So this test asserts behaviour, not shape.
#
#   Tier 1 (default)  — structural + regression checks. No auth, no model, no tokens.
#   Tier 2 (SMOKE_LIVE=1) — installs the plugin into a throwaway CLAUDE_CONFIG_DIR and
#                           runs a real command headlessly against a scratch repo.
#                           Needs a working `claude` login. Spends tokens.
#
# Usage:
#   tests/smoke.sh              # tier 1
#   SMOKE_LIVE=1 tests/smoke.sh # tier 1 + 2
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER="$REPO/hooks/speckit-helper.sh"
PASS=0
FAIL=0

ok()   { printf '  \033[32mok\033[0m   %s\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# --- Tier 1: manifest ---------------------------------------------------------------
head_ "Manifest"

for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json .mcp.json; do
  if jq empty "$REPO/$f" 2>/dev/null; then ok "$f parses"; else bad "$f is missing or invalid JSON"; fi
done

# Every path plugin.json declares must exist. A typo here disables a whole component
# silently — the plugin still installs and reports enabled.
while read -r key path; do
  [ -z "$path" ] && continue
  if [ -e "$REPO/${path#./}" ]; then ok "plugin.json $key -> $path exists"
  else bad "plugin.json $key -> $path DOES NOT EXIST (component will not load)"; fi
done < <(jq -r '{skills,commands,hooks,workflows,mcpServers}
                | to_entries[] | select(.value | type == "string")
                | "\(.key)\t\(.value)"' "$REPO/.claude-plugin/plugin.json")

while read -r agent; do
  if [ -f "$REPO/${agent#./}" ]; then ok "agent $(basename "$agent") exists"
  else bad "agent $agent DOES NOT EXIST"; fi
done < <(jq -r '.agents[]?' "$REPO/.claude-plugin/plugin.json")

# --- Tier 1: the #9 regression guard ------------------------------------------------
head_ "Payload location"

# The plugin's payload must NOT live under .claude/. That path is also where Claude Code
# looks for *project-scope* config, so shipping it there means that while working in this
# repo the project-scope copy shadows the plugin's — and a project-scope command gets no
# plugin root, so ${CLAUDE_PLUGIN_ROOT} is never substituted.
#
# The effect is that the commands behave differently here than in any real install. That is
# the blind spot that let #7 ship: it looked fine while dogfooding. See #9.
shadowed=0
for d in commands agents skills hooks workflows; do
  if [ -e "$REPO/.claude/$d" ]; then
    bad ".claude/$d shadows the plugin's own $d when working in this repo (see #9)"
    shadowed=$((shadowed + 1))
  fi
done
[ "$shadowed" -eq 0 ] && ok "no plugin payload under .claude/ — nothing shadows the plugin"

# --- Tier 1: hooks ------------------------------------------------------------------
head_ "Hooks"

while read -r cmd; do
  script="${cmd#\"\$\{CLAUDE_PLUGIN_ROOT\}\"}"
  script="$REPO/${script#/}"
  script="${script%% *}"
  name="$(basename "$script")"
  if [ ! -f "$script" ]; then bad "hook $name is declared but not shipped"
  elif [ ! -x "$script" ]; then bad "hook $name is not executable (will fail silently)"
  else ok "hook $name exists and is executable"; fi
done < <(jq -r '.hooks | to_entries[] | .value[] | .hooks[] | .command' "$REPO/hooks/hooks.json")

# --- Tier 1: the #7 regression guard ------------------------------------------------
head_ "Command → helper wiring"

# A `!` pre-execution block is permission-checked BEFORE ${CLAUDE_PLUGIN_ROOT} is
# substituted, so the checker sees a literal ${...} and rejects the command with
# "Contains expansion". No allowlist entry can match it. This shipped twice (aa32e83,
# then #7). If this assertion ever fails again, do not "fix" it by changing the rule.
if grep -rqF '!`${CLAUDE_PLUGIN_ROOT}' "$REPO/commands/"; then
  bad "a command puts \${CLAUDE_PLUGIN_ROOT} inside a ! block — rejected as 'Contains expansion' (see #7)"
  grep -rlF '!`${CLAUDE_PLUGIN_ROOT}' "$REPO/commands/" | sed 's|^|       |'
else
  ok "no command invokes the helper from a ! block"
fi

# Every subcommand a command asks for must actually be implemented. A rename here fails
# at runtime, inside a command, where nobody is watching.
missing=0
while read -r sub; do
  if ! grep -qE "^[[:space:]]*${sub}\)" "$HELPER"; then
    bad "commands call helper subcommand '$sub', which speckit-helper.sh does not implement"
    missing=$((missing + 1))
  fi
done < <(grep -rhoE 'speckit-helper\.sh [a-z-]+' "$REPO/commands/" | awk '{print $2}' | sort -u)
[ "$missing" -eq 0 ] && ok "every helper subcommand used by a command is implemented"

# --- Tier 1: helper runs ------------------------------------------------------------
head_ "Helper"

if [ -x "$HELPER" ]; then ok "speckit-helper.sh is executable"; else bad "speckit-helper.sh is not executable"; fi

for sub in branch recent-commits rtk-available; do
  if "$HELPER" "$sub" >/dev/null 2>&1; then ok "helper '$sub' runs"; else bad "helper '$sub' exits non-zero"; fi
done

# --- Tier 2: live install ------------------------------------------------------------
#
# What this CANNOT do, and why it matters: a plugin's slash commands are not reachable
# from `claude -p`. Verified — a bare `/context` silently resolves to Claude Code's
# BUILT-IN /context (the token-usage readout, nothing to do with this plugin);
# `/pr-summary` and `/ai-development-framework:context` both return "Unknown command";
# and asking the model to invoke the skill by name does nothing. Plugin commands exist
# only in an interactive session.
#
# That is precisely why the #7 bug survived four releases: the real invocation cannot be
# scripted, so nobody ever ran it. Do not "fix" this by asserting on `claude -p /context`
# — it will pass against a completely broken plugin, because it is testing a built-in.
#
# So instead of invoking the command, reproduce what the command hands the model: take the
# helper invocations out of the shipped command files, substitute the plugin root exactly
# as the harness does, and run them.
if [ "${SMOKE_LIVE:-0}" = "1" ]; then
  head_ "Live install (isolated config)"

  CFG="$(mktemp -d)"
  trap 'rm -rf "$CFG"' EXIT
  export CLAUDE_CONFIG_DIR="$CFG"   # never touch the user's real ~/.claude

  claude plugin marketplace add "$REPO" >/dev/null 2>&1
  claude plugin install ai-development-framework@ai-development-framework >/dev/null 2>&1

  if claude plugin list 2>/dev/null | grep -q 'ai-development-framework'; then
    ok "plugin installs into a clean config and reports enabled"
  else
    bad "plugin did not install"
  fi

  # A directory-sourced plugin loads in place, so its root is the clone — WITH a trailing
  # slash, which is what produces the `//` below. This is not cosmetic: it decides whether
  # the permission rule matches.
  ROOT="$REPO/"

  # Every helper invocation the commands hand to the model, substituted and executed.
  # Catches a wrong path (the bug aa32e83 was trying to fix) and a renamed subcommand —
  # both invisible until a user runs the command.
  #
  # Run them in a scratch repo, NOT in $REPO. Some subcommands mutate state:
  # `plan-phase-start` writes .specify/.plan-in-progress, which arms the plan-phase
  # write-block hook and locks up the working tree of whatever repo it runs in.
  # A realistic repo: a `main` branch and more than one commit. The pr-* subcommands diff
  # against main and fall back to HEAD~1, so a single-commit repo makes them exit 128 —
  # an artefact of the fixture, not a defect in the plugin.
  SCRATCH="$(mktemp -d)"
  git -C "$SCRATCH" init -q -b main
  git -C "$SCRATCH" -c user.email=smoke@test -c user.name=smoke commit -q --allow-empty -m "base"
  git -C "$SCRATCH" -c user.email=smoke@test -c user.name=smoke commit -q --allow-empty -m "smoke"

  broken=0
  while read -r invocation; do
    real="${invocation//\$\{CLAUDE_PLUGIN_ROOT\}/$ROOT}"
    if ! (cd "$SCRATCH" && eval "$real") >/dev/null 2>&1; then
      bad "command invocation fails as the model would run it: $real"
      broken=$((broken + 1))
    fi
  done < <(grep -rhoE '\$\{CLAUDE_PLUGIN_ROOT\}[^`]+' "$REPO/commands/" | sort -u)
  # NB: match ANY ${CLAUDE_PLUGIN_ROOT} invocation, not just speckit-helper.sh. Hardcoding
  # the script name here creates the exact blind spot this test exists to close: a command
  # pointing at a script that does not exist would never be matched, so never executed, so
  # never fail. That is the shape of the aa32e83 bug.
  rm -rf "$SCRATCH"
  [ "$broken" -eq 0 ] && ok "every helper invocation in every command runs as the model would run it"

  # The allowlist rule SETUP.md prescribes must match the string the model actually sends.
  # Compare shape, not the clone path — SETUP documents a default location, but a user may
  # clone anywhere. What must agree is the part after the plugin root: the model sends a
  # DOUBLED slash (because ${CLAUDE_PLUGIN_ROOT} ends in one) and the permission matcher
  # compares literally without normalising it. A single-slash rule silently fails to match,
  # so every helper call prompts — and a non-interactive context denies prompts, which
  # aborts the command with no output at all.
  if grep -qF '//hooks/speckit-helper.sh' "$REPO/SETUP.md"; then
    ok "SETUP prescribes the doubled-slash rule that the commands actually produce"
  else
    bad "SETUP's permission rule lacks the doubled slash, so it will never match"
    printf '       commands send: <plugin-root>//hooks/speckit-helper.sh\n'
  fi
else
  head_ "Live install"
  printf '  \033[33mskip\033[0m SMOKE_LIVE=1 to install the plugin into a throwaway config and exercise it\n'
fi

# --- Result --------------------------------------------------------------------------
printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
