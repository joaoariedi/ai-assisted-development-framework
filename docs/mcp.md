# MCP Integration

[← back to README](../README.md)

## 🔌 MCP Integration

The repo ships a **project-scoped** `.mcp.json` at its root, which Claude Code loads automatically for anyone working in this repository:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    }
  }
}
```

Export `GITHUB_TOKEN` before starting Claude Code, or the server loads with a
`Missing environment variables` warning. No token is committed — the value is expanded from
your environment at load time.

**For your own projects**, register the server once at user scope instead:

```bash
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp
claude mcp list          # verify: should report "✔ Connected"
```

> **Config locations matter.** Claude Code reads `~/.claude.json` (user scope) and `.mcp.json`
> at a project root (project scope). It does **not** read `~/.claude/mcp.json` — a file there
> is silently inert. Verify with `claude mcp list`; a server that does not appear in that
> output is not loaded, no matter how correct its JSON looks.

Add security MCP servers only when CLI tools are insufficient — each server adds context overhead. See `mcp-security.md` rule for evaluation criteria.

---

