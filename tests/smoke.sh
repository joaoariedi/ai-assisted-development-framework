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

# NEVER write `producer | grep -q pattern` in this script.
#
# `set -o pipefail` is on, and `grep -q` exits the instant it matches. The producer then dies
# with SIGPIPE (141), pipefail makes the PIPELINE return 141, and the `if` reads that as "no
# match" — so a violating file reports as clean. Worse, it is a race: on a small input the
# producer finishes before grep exits and the check works, which is how three guards in this
# suite passed their own mutation tests while being unreliable.
#
# Capture first, match second: `x="$(producer)"` then `grep -q ... <<<"$x"`. No pipe, no race.

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

# --- Tier 1: version consistency ------------------------------------------------------
head_ "Version"

# Six places declare the version and every one is bumped BY HAND. A release that updates
# plugin.json but forgets marketplace.json ships a plugin whose marketplace advertises the
# old version — and nothing else notices. (#19)
v_plugin="$(jq -r '.version' "$REPO/.claude-plugin/plugin.json")"
v_mkt_meta="$(jq -r '.metadata.version' "$REPO/.claude-plugin/marketplace.json")"
v_mkt_plug="$(jq -r '.plugins[0].version' "$REPO/.claude-plugin/marketplace.json")"
v_readme="$(grep -oE 'Framework Version\*\*: [0-9]+\.[0-9]+\.[0-9]+' "$REPO/README.md" | grep -oE '[0-9.]+$')"
v_changelog="$(grep -m1 -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$REPO/CHANGELOG.md" | tr -d '#[] ')"

mismatch=0
for pair in "marketplace.metadata:$v_mkt_meta" "marketplace.plugins[0]:$v_mkt_plug" \
            "README footer:$v_readme" "CHANGELOG latest entry:$v_changelog"; do
  where="${pair%%:*}"; val="${pair#*:}"
  if [ "$val" != "$v_plugin" ]; then
    bad "$where says $val but plugin.json says $v_plugin"
    mismatch=$((mismatch + 1))
  fi
done

# The two titles carry only major.minor.
minor="${v_plugin%.*}"
for f in README.md .claude/CLAUDE.md; do
  t="$(grep -m1 -oE 'AI Development Framework v[0-9]+\.[0-9]+' "$REPO/$f" | grep -oE '[0-9.]+$')"
  if [ "$t" != "$minor" ]; then
    bad "$f title says v$t but plugin.json says $v_plugin"
    mismatch=$((mismatch + 1))
  fi
done
[ "$mismatch" -eq 0 ] && ok "all six version declarations agree ($v_plugin)"

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

# --- Tier 1: built-in name collisions ------------------------------------------------
head_ "Command names"

# A command whose name a Claude Code BUILT-IN already owns is unreachable: typing the bare
# name gets the built-in, every time. `/context` shipped that way and nobody noticed for four
# releases, because the repo's own project-scope copy shadowed the built-in while dogfooding —
# so it worked here and nowhere else. Fixing that shadowing (#9) is what exposed it.
#
# This used to be a hand-maintained list of built-in names, which guarded the past and not the
# future: the day Claude Code ships a /quality, that command goes silently unreachable and a
# stale list says nothing (#17).
#
# So the rule is structural instead. Every command is NAMESPACED — its name contains a `.`
# (adf.quality, speckit.plan). No built-in slash command contains a dot, so a collision is
# impossible by construction, and there is no list to keep current.
unnamespaced=0
for f in "$REPO"/commands/*.md; do
  name="$(basename "$f" .md)"
  case "$name" in
    *.*) : ;;
    *)
      bad "command /$name is not namespaced — a Claude Code built-in of that name would silently shadow it (#17)"
      unnamespaced=$((unnamespaced + 1))
      ;;
  esac
done
[ "$unnamespaced" -eq 0 ] && ok "every command is namespaced — no built-in can collide with any of them"

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

# The explanatory notes in those commands must survive substitution. They exist to stop the
# `!` block being reintroduced a third time — but they are prose inside skill content, and
# skill content is substituted. A note that spells the plugin-root variable with a $ and
# braces gets its own warning replaced by a path, and reads as nonsense to the next reader.
notes="$(grep -h '^>' "$REPO"/commands/*.md || true)"
if grep -qF '${CLAUDE_PLUGIN_ROOT}' <<<"$notes"; then
  bad "a note spells out the substitutable plugin-root variable — it will be replaced by a path and the warning will be gibberish"
else
  ok "the anti-regression notes survive substitution"
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

# --- Tier 1: the permission rule the docs prescribe ----------------------------------
head_ "Documented permission rule"

# The permission matcher does NO expansion and NO normalisation. It compares the rule to the
# command string literally. Every shortcut silently fails to match — verified against the
# live matcher:
#
#   Bash(/home/you/...//hooks/speckit-helper.sh:*)   matches
#   Bash($HOME/...)                                  BLOCKED — $HOME is not expanded
#   Bash(~/...)                                      BLOCKED — ~ is not expanded
#
# A rule that does not match means the helper prompts on every call, and a non-interactive
# context denies prompts — so the command degrades or produces nothing. SETUP shipped the
# $HOME form for three releases, so the rule it told every user to add never worked.
# Inspect only what the docs PRESCRIBE — the contents of fenced code blocks. Both files also
# document $HOME and ~ as counter-examples ("❌ blocked"), in prose and tables, and flagging
# those would be a false positive. Only a rule inside a code block is one a user will paste.
# Scan every doc, not just the two that happened to carry the rule when this was written. The
# permission rule and the stow text moved to docs/ when the README was split — a guard pinned to
# README.md would then have passed trivially while docs/install.md shipped the broken rule.
bad_rule=0
for doc in "$REPO"/SETUP.md "$REPO"/README.md "$REPO"/docs/*.md; do
  [ -f "$doc" ] || continue
  fenced="$(awk '/^```/{f=!f; next} f' "$doc" || true)"
  if grep -qE 'Bash\((\$HOME|~)/[^)]*speckit-helper' <<<"$fenced"; then
    bad "$(basename "$doc") prescribes a helper rule using \$HOME or ~ — neither is expanded, so it never matches"
    bad_rule=$((bad_rule + 1))
  fi
done
[ "$bad_rule" -eq 0 ] && ok "no doc prescribes a helper rule that cannot match"

# The stow install is dead (#18) and must not be prescribed again. The payload no longer
# lives under .claude/, and the dotfiles package no longer carries agents/commands/hooks/
# skills — following those instructions yields a half-install with none of them. Only the
# REMOVAL form (`stow -D claude`) is legitimate now.
stow_bad=0
for doc in "$REPO"/README.md "$REPO"/docs/*.md; do
  [ -f "$doc" ] || continue
  fenced="$(awk '/^```/{f=!f; next} f' "$doc" || true)"
  if grep -qE '(^|[^-])\bstow claude\b' <<<"$fenced"; then
    bad "$(basename "$doc") prescribes 'stow claude' as an install — that path is dead and yields a half-install (#18)"
    stow_bad=$((stow_bad + 1))
  fi
done
[ "$stow_bad" -eq 0 ] && ok "no doc prescribes the dead stow install path"

# --- docs stay honest -----------------------------------------------------------------
# Two ways a split README rots: a command ships with no entry in the reference, and a link
# points at a doc that was renamed or never written. Both are silent.
undocumented=0
for f in "$REPO"/commands/*.md; do
  name="$(basename "$f" .md)"
  grep -qF "/$name" "$REPO/docs/commands.md" || {
    bad "command /$name is not documented in docs/commands.md"
    undocumented=$((undocumented + 1))
  }
done
[ "$undocumented" -eq 0 ] && ok "every command appears in docs/commands.md"

broken=0
for doc in "$REPO"/README.md "$REPO"/docs/*.md; do
  [ -f "$doc" ] || continue
  dir="$(dirname "$doc")"
  while read -r link; do
    [ -z "$link" ] && continue
    case "$link" in http*|\#*) continue ;; esac
    target="${link%%#*}"
    [ -e "$dir/$target" ] || {
      bad "$(basename "$doc") links to $target, which does not exist"
      broken=$((broken + 1))
    }
  done < <(grep -oE '\]\([^)]+\)' "$doc" | sed 's/^](//; s/)$//' || true)
done
[ "$broken" -eq 0 ] && ok "every relative link in the docs resolves"

# The payload moved out of .claude/ in 5.0 (#9), but the docs went on describing the old layout —
# an architecture diagram and two file paths that had not existed for a release. Splitting the
# README is what exposed them. `~/.claude/...` is legitimate (the user's home, legacy installs);
# a bare `.claude/<payload>/` is this repo's own layout, and it is wrong.
# The lookbehind excludes anything path-prefixed (`~/.claude/agents/`, `/home/you/.claude/...`) —
# those are the USER's home directory and are legitimate. Only a bare, relative
# `.claude/<payload>/` refers to this repo's layout, and that is the thing that is wrong.
stale_paths="$(grep -rnP '(?<![~/])\.claude/(commands|agents|hooks|workflows)/' "$REPO/docs" "$REPO/README.md" 2>/dev/null || true)"
if [ -n "$stale_paths" ]; then
  bad "docs describe the pre-5.0 layout — the payload does not live under .claude/ (#9)"
  sed 's|^|       |' <<<"$stale_paths" | head -3
else
  ok "docs describe the payload where it actually lives"
fi

# --- Tier 1: helper runs ------------------------------------------------------------
head_ "Helper"

if [ -x "$HELPER" ]; then ok "speckit-helper.sh is executable"; else bad "speckit-helper.sh is not executable"; fi

for sub in branch recent-commits rtk-available; do
  if "$HELPER" "$sub" >/dev/null 2>&1; then ok "helper '$sub' runs"; else bad "helper '$sub' exits non-zero"; fi
done

# The helper must survive the repos it will actually meet, not just this one. The pr-*
# subcommands used to diff against `main` and fall back to HEAD~1 with nothing after it, so
# a repo whose only commit is its first exited 128 (#16). A non-zero helper inside a command
# yields no data and the command degrades silently — and the model papers over it by running
# plain git instead, so nobody notices.
hostile=0
ROOTREPO="$(mktemp -d)"; NOGIT="$(mktemp -d)"
git -C "$ROOTREPO" init -q -b main
git -C "$ROOTREPO" -c user.email=smoke@test -c user.name=smoke commit -q --allow-empty -m "root commit"
for sub in pr-commits pr-files pr-stats; do
  (cd "$ROOTREPO" && "$HELPER" "$sub") >/dev/null 2>&1 || { bad "helper '$sub' exits non-zero in a root-commit repo (#16)"; hostile=$((hostile + 1)); }
  (cd "$NOGIT"    && "$HELPER" "$sub") >/dev/null 2>&1 || { bad "helper '$sub' exits non-zero outside a git repo"; hostile=$((hostile + 1)); }
done
rm -rf "$ROOTREPO" "$NOGIT"
[ "$hostile" -eq 0 ] && ok "pr-* subcommands survive a root-commit repo and a non-git directory"

# --- Tier 2: live install ------------------------------------------------------------
#
# Two things you must not do here, both of which produce a green test against a broken plugin:
#
# 1. Do NOT assert on `claude -p "/project-context"`. A plugin's SLASH commands do not exist
#    in headless mode — `/project-context` returns "Unknown command", and before the rename
#    a bare `/context` silently resolved to Claude Code's BUILT-IN /context (a token-usage
#    readout that has nothing to do with this plugin). Asserting on that passes always.
#    Plugin commands ARE reachable headlessly as SKILLS. That is what tier 3 below drives.
#
# 2. Do NOT assert that the helper's DATA appears in the output. When the helper is blocked,
#    the model cheerfully falls back to plain `git log` / `git branch` and produces the same
#    data by hand. An assertion on the data goes green while every helper call is being
#    denied — this exact false positive happened while writing tier 3. Assert on the TOOL
#    CALLS instead: the helper was invoked, and was not denied.
if [ "${SMOKE_LIVE:-0}" = "1" ]; then
  head_ "Live install (isolated config)"

  CFG="$(mktemp -d)"
  trap 'rm -rf "$CFG"' EXIT
  export CLAUDE_CONFIG_DIR="$CFG"   # never touch the user's real ~/.claude

  claude plugin marketplace add "$REPO" >/dev/null 2>&1
  claude plugin install ai-development-framework@ai-development-framework >/dev/null 2>&1

  installed="$(claude plugin list 2>/dev/null || true)"
  if grep -q 'ai-development-framework' <<<"$installed"; then
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

  # --- Tier 3: end to end, through a real model session -------------------------------
  #
  # Drive the command the way a user does and assert the helper actually ran. This is the
  # only check that exercises the whole chain at once: skill loads -> ${CLAUDE_PLUGIN_ROOT}
  # substitutes -> model runs the helper with Bash -> the PERMISSION RULE MATCHES -> output
  # comes back. Every bug in 4.5.0 lived somewhere on that chain.
  #
  # Needs an authenticated `claude` and spends tokens, so it cannot run in CI. It is worth
  # it: it is the only check that would have caught the $HOME permission rule, which three
  # releases of SETUP told every user to add and which never matched anything.
  #
  # The plugin is loaded from the working tree with --plugin-dir, so this tests THIS
  # checkout, not whatever is installed.
  head_ "End to end (real session, spends tokens)"

  # Tier 2 pointed CLAUDE_CONFIG_DIR at a throwaway config. That config has no credentials,
  # so leaving it set here makes every model call fail with "Not logged in" — and the check
  # would skip itself forever while looking like it had run. Restore the real config.
  unset CLAUDE_CONFIG_DIR

  probe="$(claude -p "reply with exactly: ok" 2>&1 || true)"
  if grep -qi 'not logged in' <<<"$probe"; then
    printf '  \033[33mskip\033[0m not logged in — `claude /login` to run the end-to-end check\n'
  else
    E2E="$(mktemp -d)"
    git -C "$E2E" init -q -b main
    printf '{"name":"scratch","version":"1.0.0"}' > "$E2E/package.json"
    git -C "$E2E" add -A
    git -C "$E2E" -c user.email=smoke@test -c user.name=smoke commit -q -m "SMOKE_MARKER_COMMIT"

    # Both slash forms. The trailing slash on ${CLAUDE_PLUGIN_ROOT} is NOT stable: a
    # marketplace/directory install yields `//`, --plugin-dir yields a single `/`. Neither
    # entry is redundant.
    rules="$(jq -n --arg a "Bash($REPO//hooks/speckit-helper.sh:*)" \
                   --arg b "Bash($REPO/hooks/speckit-helper.sh:*)" \
                   '{permissions:{allow:[$a,$b],deny:[]}}')"

    run="$(cd "$E2E" && timeout 300 claude -p \
        "Invoke the skill ai-development-framework:adf.context and follow its instructions." \
        --plugin-dir "$REPO" --settings "$rules" --output-format json 2>&1 || true)"
    rm -rf "$E2E"

    called="$(jq -r '.. | objects | select(.name=="Bash") | .input.command' <<<"$run" 2>/dev/null \
              | grep -c 'speckit-helper' || true)"

    if [ "${called:-0}" -eq 0 ]; then
      bad "the command never made the model run the helper at all"
    elif grep -qF 'requires approval' <<<"$run"; then
      bad "the helper was DENIED by the permission checker — the rule in SETUP does not match what the command sends"
      jq -r '.. | objects | select(.name=="Bash") | .input.command' <<<"$run" 2>/dev/null \
        | grep 'speckit-helper' | head -1 | sed 's|^|       sent: |'
    else
      ok "end to end: the skill ran the helper and the permission rule matched ($called calls)"
    fi
  fi
else
  head_ "Live install"
  printf '  \033[33mskip\033[0m SMOKE_LIVE=1 to install the plugin into a throwaway config and exercise it\n'
fi

# --- Result --------------------------------------------------------------------------
printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
