# SETUP — install or update the AI Development Framework on this machine

**This file is a runbook for a Claude Code agent.** Hand it to an agent ("follow SETUP.md") and it will install the framework as a plugin, or update an existing install, and report what it did.

It is idempotent: safe to run on a clean machine, and safe to re-run on a machine that already has it.

**Prerequisites:** `git`, and the `claude` CLI on `PATH`. Check both before starting; if either is missing, stop and say so rather than attempting a workaround.

---

## Conventions for the agent executing this

- **Verify, do not assume.** After every step there is a check. Run it. A component that does not appear in a listing is not installed, and its absence is silent — that failure mode is the single most common one in this framework's history.
- **Never overwrite `~/.claude/settings.json`.** It is the user's file and may contain unrelated settings. Read it, merge, write it back. If it does not parse as JSON, stop and report — do not "fix" it.
- **Do not `sudo` anything.** Nothing here needs root.
- If a step fails, **stop and report** with the exact command and its output. Do not improvise an alternative install path.

---

## Step 0 — Decide the clone location

Default: `~/.claude-framework`.

This path matters beyond taste: the plugin is loaded **from the clone, in place**, so the clone location becomes part of the permission rule in Step 4 and the update procedure in Step 6. If the user has already cloned it elsewhere, use their path and substitute it everywhere below. Export it once:

```bash
FRAMEWORK_DIR="$HOME/.claude-framework"
```

## Step 1 — Check for a conflicting legacy install

Earlier versions were installed by symlinking a dotfiles package into `~/.claude/` with GNU Stow. **Stow and the plugin must not both be active** — every command, agent, and skill would register twice.

```bash
ls ~/.claude/commands/speckit.plan.md ~/.claude/agents/quality-guardian.md ~/.claude/hooks/speckit-helper.sh 2>/dev/null
```

- **Nothing listed** → clean. Continue.
- **Files listed** → a legacy install is present. **Stop and ask the user** whether to remove it (`cd ~/dotfiles && stow -D claude`) before continuing. Do not delete anything in `~/.claude/` on your own initiative — those may be symlinks into a dotfiles repository the user maintains by hand.

## Step 2 — Clone, or pull if already present

```bash
if [ -d "$FRAMEWORK_DIR/.git" ]; then
  git -C "$FRAMEWORK_DIR" pull --ff-only
else
  git clone https://github.com/joaoariedi/ai-assisted-development-framework.git "$FRAMEWORK_DIR"
fi
```

**Check:** `test -f "$FRAMEWORK_DIR/.claude-plugin/plugin.json"` and `test -f "$FRAMEWORK_DIR/.claude-plugin/marketplace.json"`. Both must exist. If `marketplace.json` is missing, the checkout predates installable packaging — report that and stop.

## Step 3 — Add the marketplace and install the plugin

A plugin is installed **from a marketplace**; the repository ships one that lists exactly itself.

```bash
claude plugin marketplace add "$FRAMEWORK_DIR"
claude plugin install ai-development-framework@ai-development-framework
```

If the marketplace is already configured, `add` will say so — that is not an error. In that case refresh it instead:

```bash
claude plugin marketplace update ai-development-framework
```

**Check:**

```bash
claude plugin list
```

Expect `ai-development-framework@ai-development-framework` with `Status: ✔ enabled`. This writes `enabledPlugins` into `~/.claude/settings.json`, so the install is persistent and user-scoped: it applies to every project, with no flags.

## Step 4 — Add the helper permission rule (required in practice)

Most spec-kit commands gather live project data by running `speckit-helper.sh` with the Bash
tool. Without an allowlist entry, every one of those calls prompts.

Merge the following into `~/.claude/settings.json`, preserving everything already there.
Substitute the real clone path — `$HOME` is expanded in permission rules, but
`${CLAUDE_PLUGIN_ROOT}` is **not**, and a leading wildcard does **not** match, so the path
must be literal and absolute.

```jsonc
{
  "permissions": {
    "allow": [
      "Bash($HOME/.claude-framework//.claude/hooks/speckit-helper.sh:*)",
      "Bash($HOME/.claude-framework/.claude/hooks/speckit-helper.sh:*)"
    ]
  }
}
```

Both entries are deliberate, and the doubled slash in the first is not a typo.
`${CLAUDE_PLUGIN_ROOT}` expands **with a trailing slash**, so the command
`${CLAUDE_PLUGIN_ROOT}/.claude/hooks/speckit-helper.sh` reaches the permission matcher as
`…/.claude-framework//.claude/hooks/…`. The matcher compares strings literally and does not
normalise `//`, so a rule written with a single slash silently fails to match it. The second
entry covers the case where a future release drops the trailing slash. Keep both.

**Do not "fix" the commands by moving these calls back into a `` !`…` `` pre-execution
block.** It does not work, and the failure is confusing: a `!` block is permission-checked
*before* `${CLAUDE_PLUGIN_ROOT}` is substituted, so the checker sees a literal `${…}` and
rejects the command with `Contains expansion` — no allowlist entry can match it, and
`allowed-tools:` frontmatter does not help. `${CLAUDE_PROJECT_DIR}` *is* substituted before
the check, but it points at the user's project, not the plugin. This has been shipped broken
twice; the commands now instruct the model to run the helper with the Bash tool instead.

Optional, only if the user wants Agent Teams (experimental, and it costs a full session per teammate — ask first, do not enable it silently):

```jsonc
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

Optional: the bundled GitHub MCP server connects only if `GITHUB_TOKEN` is exported in the user's shell. Mention it; do not create a token.

## Step 5 — Verify (this is the part that actually matters)

Verification is not optional here — this framework's recurring failure mode is a component that validates cleanly and never loads. **Start a new Claude Code session** (components are loaded at startup), then check, in increasing order of strength:

1. **Installed:**
   ```bash
   claude plugin list          # ✔ enabled
   ```
2. **Loaded:** the `/` menu lists the framework's commands (`/context`, `/quality`, `/speckit.plan`, …). *A component that does not appear here is not loaded.*
3. **Works:** run `/context` in any git repository. It should print a project summary. **If it prints nothing at all, Step 4 is missing or its path is wrong.**
4. **The workflow resolves** — it is the one component that must be called by its full namespaced name:
   ```
   ai-development-framework:speckit-workflow
   ```
   A bare `speckit-workflow` does not resolve.

**Known quirk — do not chase it:** `claude plugin details ai-development-framework` reports `Agents (0)`. All six agents load correctly regardless; this is a defect in the inventory display, confirmed by dispatching the agents in a live session. Trust the `/` menu and a live dispatch over the inventory.

## Step 6 — How to update, later

```bash
git -C "$FRAMEWORK_DIR" pull
claude plugin marketplace update ai-development-framework
```

Then restart Claude Code. Read `CHANGELOG.md` in the clone to see what changed. Re-running this whole runbook achieves the same thing.

---

## Report back

When finished, tell the user plainly:

- what was **installed vs. already present** (and whether this run was a fresh install or an update);
- the **clone path** and the exact **permission rule** written, and whether `settings.json` was modified;
- whether a **legacy stow install** was found, and what was done about it;
- the result of each verification check in Step 5 — **including anything that failed**;
- anything left for the human: restarting Claude Code, exporting `GITHUB_TOKEN`, enabling Agent Teams.

Report failures as failures. An install that is not verified is not an install.
