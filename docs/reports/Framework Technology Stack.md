# Framework Technology Stack

> A visual map of the layers, components, and integrations that make the AI Development Framework v4.3 work.
> The framework is *not* a single tool — it is a **composition of methodologies, runtimes, integrations, and models**, with cross-cutting concerns (security, context, quality, memory) governing every layer.

---

## 1. The Layered Stack

The stack reads top-down from **human intent** to **foundation models**. Each layer depends on the one below for raw capability, and serves the one above with structure or reasoning.

```mermaid
flowchart TB
    classDef user fill:#FFE4B5,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef framework fill:#E6E6FA,stroke:#6A5ACD,stroke-width:2px,color:#000
    classDef agent fill:#B0E0E6,stroke:#4682B4,stroke-width:2px,color:#000
    classDef tools fill:#98FB98,stroke:#2E8B57,stroke-width:2px,color:#000
    classDef model fill:#FFB6C1,stroke:#C71585,stroke-width:2px,color:#000
    classDef sidecar fill:#F0E68C,stroke:#BDB76B,stroke-width:1px,color:#000

    subgraph L0["L0 · Developer Intent"]
        DEV["Developer / Operator<br/>(prompts, plans, reviews)"]
    end

    subgraph L1["L1 · Methodology — How the work is structured"]
        SDD["Spec-Driven Dev (spec-kit)<br/>specify → plan → tasks → implement"]
        OPENSPEC["OpenSpec<br/>(alternative spec workflow)"]
        SUPER["Superpowers<br/>(skill-pack / capability bundles)"]
        WF["Custom 4-Phase Workflow<br/>Planning → Impl → Review → Retro"]
    end

    subgraph L2["L2 · Agent Runtime — Where reasoning happens"]
        CC["Claude Code<br/>(CLI · IDE · Web · Mobile)"]
        ALT["Alternatives<br/>Codex · Opencode<br/>Cursor · Aider"]
        subgraph SUB["Specialised Sub-Agents (in Claude Code)"]
            direction LR
            S1[Explore]
            S2[Plan]
            S3[general-purpose]
            S4[test-specialist]
            S5[quality-guardian]
            S6[code-reviewer]
            S7[review-coordinator]
            S8[forensic-specialist]
            S9[repo-scout]
        end
    end

    subgraph L3["L3 · Tools & Integrations — Capability extension"]
        subgraph EXT["Protocols & Extension Points"]
            MCP["MCP Servers<br/>Gmail · Drive · Calendar · voicemode<br/>(opt) Semgrep · Snyk · GitHub"]
            HOOKS["Hooks<br/>PreToolUse · PostToolUse · Stop · Notification"]
            SKILLS["Skills & Slash Commands<br/>/speckit.* · /quality · /context · /agent"]
        end
        subgraph MULT["Agent Multipliers"]
            RTK["rtk v0.37<br/>(60–90% CLI output compression)"]
            FAB["Fabric<br/>(reusable prompt patterns)"]
        end
        subgraph QSEC["Quality / Security CLIs (called via Bash)"]
            GL[Gitleaks]
            SG[Semgrep]
            TRIV[Trivy]
            RUFF[Ruff]
            GOSEC[gosec]
            GVC[govulncheck]
        end
    end

    subgraph L4["L4 · Model Layer — Foundation reasoning"]
        subgraph ANT["Anthropic (primary)"]
            OP["Opus 4.7 (1M ctx)<br/>complex reasoning"]
            SON["Sonnet 4.6<br/>standard work"]
            HAI["Haiku 4.5<br/>cheap fetches"]
        end
        subgraph OTH["Other Providers (alternatives)"]
            GPT["GPT-5 · Codex<br/>(via OpenAI)"]
            GEM["Gemini<br/>(via Google)"]
            QW["Qwen<br/>(via Alibaba / local)"]
            LL["Llama<br/>(local Ollama)"]
        end
    end

    subgraph CROSS["⊥ Cross-Cutting Concerns"]
        direction LR
        QG["Quality Gates<br/>Tier 1/2/3"]
        SEC["LLM Security<br/>OWASP LLM Top-10"]
        CTX["Context Mgmt<br/>40% Smart Zone<br/>Document & Clear"]
        MEM["Auto-Memory<br/>(persistent across sessions)"]
    end

    DEV --> L1
    L1 --> CC
    L1 -. alternative runtime .-> ALT
    CC --> SUB
    CC --> EXT
    SUB --> EXT
    SUB --> MULT
    SUB --> QSEC
    CC --> MULT
    EXT --> ANT
    SUB --> ANT
    ALT -. could use .-> OTH
    ALT -. could use .-> ANT
    MULT -. wraps Bash output for .-> CC
    CROSS -. governs .- L1
    CROSS -. governs .- L2
    CROSS -. governs .- L3

    class DEV user
    class SDD,OPENSPEC,SUPER,WF framework
    class CC,ALT,SUB,S1,S2,S3,S4,S5,S6,S7,S8,S9 agent
    class MCP,HOOKS,SKILLS,RTK,FAB,GL,SG,TRIV,RUFF,GOSEC,GVC tools
    class OP,SON,HAI,QW,GPT,GEM,LL model
    class QG,SEC,CTX,MEM sidecar
```

### Layer cheat-sheet

| Layer | Question it answers | Examples in this framework |
|------:|---------------------|----------------------------|
| **L0 — Intent** | *What does the human want?* | Developer prompts, plan reviews, approvals |
| **L1 — Methodology** | *How is the work structured?* | spec-kit (SDD), OpenSpec, Superpowers, custom 4-phase workflow |
| **L2 — Agent Runtime** | *Who is doing the reasoning?* | Claude Code (primary) + 9 specialised sub-agents; alternatives: Codex, Opencode, Cursor |
| **L3 — Tools & Integrations** | *How does the agent reach the world?* | MCP servers, hooks, skills, **rtk** (compression), **Fabric** (patterns), security CLIs |
| **L4 — Models** | *What actually generates the tokens?* | Opus 4.7 / Sonnet 4.6 / Haiku 4.5; alternatives: GPT, Gemini, Qwen, Llama |
| **⊥ — Cross-cutting** | *What governs every layer?* | Quality gates, LLM security, context management, persistent memory |

---

## 2. Request Flow — How a Single Prompt Traverses the Stack

Concrete example: developer issues `/speckit.specify "add user auth"`. Notice where **rtk** intercepts and where the **sub-agent** isolates context.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant FW as L1 · Methodology<br/>(spec-kit)
    participant CC as L2 · Claude Code<br/>(main agent)
    participant Sub as L2 · Sub-Agent<br/>(test-specialist)
    participant MCP as L3 · MCP / Hooks
    participant RTK as L3 · rtk proxy
    participant Mod as L4 · Opus 4.7

    Dev->>FW: /speckit.specify "user auth"
    FW->>CC: invoke pipeline (spec → plan → tasks)
    CC->>Mod: reason about spec
    Mod-->>CC: spec draft + plan
    CC->>Sub: dispatch (one-shot, isolated ctx)
    Sub->>RTK: rtk pytest -q
    RTK-->>Sub: compressed digest (≈10% tokens)
    Sub->>Mod: analyse failing tests
    Mod-->>Sub: fix proposal
    Sub-->>CC: digest only (200 tok vs 5 000)
    CC->>MCP: PreToolUse hook (gitleaks, sensitive-file block)
    MCP-->>CC: ✓ safe to write
    CC->>Mod: synthesise final patch
    Mod-->>CC: code + tests
    CC-->>Dev: spec + tests + commit ready
```

### What the flow reveals

- **L1 governs structure**, not execution. spec-kit doesn't *do* anything — it shapes how the agent thinks.
- **L2 is the only layer that holds conversation state.** Sub-agents are dispatched and their context is *thrown away* — only the digest returns. This is the framework's primary defence against the "Dumb Zone" (>40% context usage).
- **L3 is where token economics happen.** `rtk` compresses noisy CLI output before it ever enters L2's context. MCP hooks enforce safety boundaries the model cannot bypass.
- **L4 is stateless.** Models receive a prompt and emit a response — every other layer exists to give them the right context and route their output safely.

---

## 3. The Combination Effect

The framework's value is not in any single layer — it is in their **composition**:

- A **methodology** (L1) without an **agent** (L2) is a manifesto.
- An **agent** (L2) without **tools** (L3) is a chatbot.
- **Tools** (L3) without **rtk / sub-agents** drown the agent in tokens and push it into the Dumb Zone.
- A **model** (L4) without the cross-cutting **quality / security / memory** layers will hallucinate, leak secrets, or forget yesterday's decisions.

Every layer's job is to make the layer above it *more reliable* than it would be alone — and to make the layer below it *more efficient* than it would be alone.

---

## 4. Currently In Use vs Available

| Component | Status on this machine | Notes |
|-----------|------------------------|-------|
| spec-kit (SDD) | ✅ active | `.claude/commands/speckit.*` |
| OpenSpec | ⚪ not adopted | Alternative to spec-kit |
| Superpowers | ⚪ pattern only | Skill-pack architecture is the influence, not the literal repo |
| Claude Code | ✅ primary runtime | Opus 4.7 1M ctx default |
| Codex / Opencode / Cursor | ⚪ alternatives | Same methodology layer would still apply |
| MCP: Gmail, Drive, Calendar, voicemode | ✅ authenticated | See `~/.claude/mcp.json` |
| MCP: Semgrep, Snyk, SonarQube | ⚪ optional | Add only when CLI scans aren't enough |
| **rtk v0.37** | ✅ available (auto-detected per machine) | 60–90% token reduction on common dev commands |
| Fabric | ⚪ pattern reference | Prompt-pattern library, used selectively |
| gitleaks · semgrep · trivy · ruff · gosec | ✅ via Bash | Quality / security CLIs |
| Opus 4.7 / Sonnet 4.6 / Haiku 4.5 | ✅ via Anthropic | Model selection per task |

---

*Generated 2026-04-17. Diagrams use Mermaid — they render natively on GitHub, GitLab, Obsidian, and most Markdown viewers.*
