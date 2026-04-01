# Fabric Integration Analysis: Prompt Orchestration as a Complementary Layer for the AI Development Framework

> Analysis of [danielmiessler/fabric](https://github.com/danielmiessler/fabric) (v1.4.437, 40k+ stars, Go, MIT) and its potential integration points with the AI Development Framework v4.3.

**Date:** 2026-04-01

---

## 1. What Fabric Is

Fabric is an open-source CLI tool that solves what its author calls AI's **integration problem**: AI capability is abundant, but weaving it into daily workflows remains friction-heavy. Fabric's answer is to organize prompts into a curated, crowdsourced, versioned library called **Patterns** and expose them as Unix-pipe-friendly commands.

The guiding philosophy: *break problems into discrete components, then apply AI to each component one at a time.*

**Technology:** Single Go binary, no runtime dependencies beyond an API key. Config lives at `~/.config/fabric/`.

**Core data flow:**
```
stdin / URL / YouTube / clipboard
    → fabric --pattern <name> --model <model> [--strategy <strategy>]
    → stdout / file / clipboard
```

Everything is pipe-friendly. A Pattern becomes the system prompt. User text becomes the user turn. Output streams to stdout.

---

## 2. Architecture and Key Features

### 2.1 The Pattern System (251 Built-in Patterns)

Each pattern is a Markdown file at `data/patterns/<name>/system.md` with a consistent structure:

- `# IDENTITY and PURPOSE` — assigns the model a role
- `# STEPS` — ordered instructions
- `# OUTPUT INSTRUCTIONS` — formatting rules (word counts, sections, bullet formats)
- `# INPUT` — placeholder for user content

Patterns are organized by domain:

| Category | Examples |
|----------|---------|
| **Code & Dev** | `review_code`, `explain_code`, `create_coding_feature`, `summarize_git_diff`, `write_pull-request`, `generate_code_rules` |
| **Security** | `analyze_malware`, `create_stride_threat_model`, `write_semgrep_rule`, `write_nuclei_template_rule`, `create_sigma_rules`, `analyze_incident`, `analyze_logs` |
| **Content Extraction** | `extract_wisdom`, `extract_ideas`, `extract_insights`, `extract_recommendations` |
| **Summarization** | `summarize`, `summarize_paper`, `summarize_meeting`, `summarize_lecture`, `create_micro_summary` |
| **Writing** | `write_essay`, `improve_writing`, `improve_academic_writing`, `humanize`, `fix_typos` |
| **Analysis** | `analyze_claims`, `find_logical_fallacies`, `analyze_paper`, `rate_content` |
| **Visualization** | `create_mermaid_visualization`, `create_conceptmap`, `create_excalidraw_visualization` |

**Custom patterns** are stored separately from upstream and survive `fabric --updatepatterns`. They take priority over built-in patterns with the same name.

### 2.2 Multi-Provider AI Router

Fabric natively supports 20+ AI providers through dedicated Go plugins:

| Category | Providers |
|----------|-----------|
| **Tier 1 (native plugins)** | OpenAI, Anthropic, Google Gemini, Ollama, Azure OpenAI, Azure Entra ID, Amazon Bedrock, Vertex AI, LM Studio, Perplexity, Microsoft 365 Copilot |
| **OpenAI-compatible** | Groq, Mistral, OpenRouter, Together, DeepSeek, Cerebras, Venice AI, GitHub Models, GrokAI, Novita, SiliconCloud, and more |

Model selection is per-invocation:
```bash
fabric -m claude-sonnet-4-5 -V anthropic -p summarize
```

Or per-pattern via environment variables:
```bash
export FABRIC_MODEL_PATTERN_SUMMARIZE=anthropic|claude-sonnet-4-5
```

### 2.3 Reasoning Strategies

A layer on top of patterns that modifies how the model reasons:

| Strategy | Key | Description |
|----------|-----|-------------|
| Chain of Thought | `cot` | Step-by-step reasoning |
| Chain of Draft | `cod` | Iterative drafting with minimal notes |
| Tree of Thought | `tot` | Multiple reasoning paths, select best |
| Atom of Thought | `aot` | Break into smallest independent sub-problems |
| Self-Refinement | `self-refine` | Answer → critique → refined answer |
| Reflexion | `reflexion` | Answer → brief critique → refined answer |

Applied via `--strategy cot` alongside any pattern.

### 2.4 Key Integrations

- **YouTube:** `fabric -y <URL>` extracts transcripts, timestamps, comments, metadata via `yt-dlp`
- **Web scraping:** `fabric -u <URL>` converts webpages to Markdown via Jina AI
- **REST API:** `fabric --serve` exposes all functionality on `:8080` with Swagger docs
- **Ollama compatibility mode:** `fabric --serve --serveOllama` — patterns appear as "models" to any Ollama client
- **Web search:** `--search` flag enables built-in web search for supported providers
- **Speech-to-text:** `--transcribe-file` via OpenAI Whisper API
- **Image generation:** `--image-file` for model-backed image generation

### 2.5 Shell Alias System

Fabric can generate one shell alias per pattern, so `summarize` becomes equivalent to `fabric --pattern summarize`. This turns 251 patterns into 251 standalone CLI commands.

---

## 3. Complementarity Analysis: Fabric vs. AI Development Framework

The two tools occupy **different layers** of the AI-assisted development stack and have minimal overlap:

| Dimension | AI Development Framework v4.3 | Fabric |
|-----------|-------------------------------|--------|
| **Execution model** | Interactive, multi-turn, agentic | Single-shot, one pattern per invocation |
| **Context** | Stateful sessions with memory, tasks, specs | Stateless (no session memory) |
| **Scope** | Full SDLC (spec → plan → implement → test → review → merge) | Individual analysis/transformation tasks |
| **AI provider** | Claude only (via Claude Code) | 20+ providers, hot-swappable |
| **Prompt management** | Rules + skills + agents (Markdown, loaded into system prompt) | Patterns (Markdown, used as system prompt) |
| **Quality enforcement** | Hooks, Iron Laws, quality gates, layered defense | None (output only) |
| **Integration style** | Deep IDE/terminal integration with file system access | Unix pipe philosophy, no file system mutation |

**Key insight:** Fabric is a prompt execution engine. The framework is an orchestration and governance layer. They are complementary, not competing.

---

## 4. Integration Opportunities

### 4.1 Security Pattern Pipeline Enhancement

**Current state:** The framework's `security-review` skill and `forensic-specialist` agent run SAST tools (semgrep, gitleaks, gosec) and analyze results within Claude Code sessions, consuming context window tokens for analysis.

**Fabric enhancement:** Offload specific security analysis tasks to Fabric patterns as pre-processing steps, keeping the Claude Code context clean:

```bash
# Generate Semgrep rules from vulnerability descriptions
echo "SQL injection via unsanitized user input in Go net/http handlers" | \
  fabric -p write_semgrep_rule -m claude-sonnet-4-5 -V anthropic > .semgrep/custom-rules/sqli-http.yaml

# Generate Sigma detection rules for the forensic-specialist
cat incident-report.md | fabric -p create_sigma_rules > sigma-rules/incident-2026-04.yml

# STRIDE threat model as input to security-review skill
cat docs/architecture.md | fabric -p create_stride_threat_model > .specify/security/threat-model.md

# Analyze threat intelligence before feeding to forensic-specialist
fabric -u "https://example.com/advisory/CVE-2026-XXXX" -p analyze_threat_report > threat-summary.md
```

**Integration point:** The `quality-before-commit.sh` hook could optionally invoke Fabric patterns for deeper security analysis when specific file types are staged. The `forensic-specialist` agent could reference Fabric-generated threat models and Sigma rules as input artifacts.

### 4.2 Knowledge Extraction for Context Engineering

**Current state:** The framework's context-management rule describes the Document & Clear pattern and WISC framework for managing context degradation. Developers manually process external resources (conference talks, papers, documentation) to extract relevant knowledge.

**Fabric enhancement:** Use `extract_wisdom`, `summarize_paper`, and `summarize_lecture` patterns to pre-process knowledge sources into structured, token-efficient summaries before loading them into Claude Code sessions:

```bash
# Extract actionable insights from a conference talk on API security
fabric -y "https://youtube.com/watch?v=..." -p extract_wisdom -o .claude/context/api-security-insights.md

# Summarize a research paper before referencing in a spec
cat paper.pdf | fabric -p summarize_paper -o .specify/research/paper-summary.md

# Condense API documentation for a CLAUDE.md reference
fabric -u "https://docs.example.com/api/v2" -p summarize -o docs/api-summary.md
```

**Integration point:** These pre-processed summaries become context-efficient inputs for the framework's planning phases (Phase 1, Steps 1-4). Instead of loading raw documentation into the context window, load Fabric-distilled summaries. This directly supports the WISC "Select" and "Compress" phases described in the Context Engineering report.

### 4.3 Git Workflow Augmentation

**Current state:** The framework's `git-workflow.md` rule defines commit message format and the `review-coordinator` agent handles PR creation. Both operate within Claude Code sessions.

**Fabric enhancement:** Quick git operations that don't need full Claude Code context:

```bash
# Quick commit message from staged changes (outside Claude Code)
git diff --staged | fabric -p summarize_git_diff

# Draft PR description for review-coordinator to refine
git log main..HEAD --oneline | fabric -p write_pull-request

# Summarize what changed in a feature branch
git diff main...HEAD | fabric -p summarize_git_changes
```

**Integration point:** These can serve as drafts that the `review-coordinator` agent refines within a Claude Code session, or as standalone utilities for simple commits that don't warrant a full agent session.

### 4.4 Spec-Kit Pipeline Pre-Processing

**Current state:** The speckit pipeline (`brainstorm → specify → plan → review → tasks → implement`) operates entirely within Claude Code sessions. The `/speckit.brainstorm` command conducts Socratic exploration before specification.

**Fabric enhancement:** Use Fabric patterns to prepare structured inputs for the speckit pipeline:

```bash
# Analyze competing approaches before /speckit.brainstorm
cat design-options.md | fabric -p analyze_claims -o .specify/research/approach-analysis.md

# Extract requirements from existing documentation
cat product-brief.md | fabric -p extract_recommendations -o .specify/research/requirements-draft.md

# Generate Mermaid diagrams for architecture discussions
cat .specify/specs/feature/plan.md | fabric -p create_mermaid_visualization

# Rate the quality of a specification
cat .specify/specs/feature/spec.md | fabric -p rate_content
```

**Integration point:** The `/speckit.specify` and `/speckit.plan` commands could reference Fabric-generated analysis as input artifacts in the `.specify/specs/<branch>/research.md` file.

### 4.5 Custom Pattern Library Aligned with Framework Conventions

The most impactful integration would be creating **custom Fabric patterns** that mirror the framework's specific conventions:

| Custom Pattern | Purpose | Framework Alignment |
|----------------|---------|---------------------|
| `fw_quality_report` | Format quality-guardian output as structured Markdown | Standardizes quality gate reporting |
| `fw_spec_review` | Analyze a spec.md against the framework's spec template | Pre-validates before `/speckit.review` |
| `fw_security_posture` | Generate a security posture statement for CLAUDE.md | Follows the CLAUDE.md Template Guidance |
| `fw_trust_boundaries` | Extract trust boundaries from architecture docs | Populates the Trust Boundary Documentation section |
| `fw_change_map` | Analyze imports/dependencies to generate cross-cutting change maps | Populates the Cross-Cutting Change Maps section |
| `fw_claude_md` | Generate a CLAUDE.md skeleton from project analysis | Follows all framework CLAUDE.md conventions |

These would live in a custom patterns directory (e.g., `~/dotfiles/fabric/patterns/`) and be version-controlled alongside the framework.

### 4.6 Multi-Model Cost Optimization

**Current state:** The framework uses Claude exclusively through Claude Code, with model tiers (haiku/sonnet/opus) for cost management.

**Fabric enhancement:** Route low-stakes analysis tasks to cheaper or local models via Fabric, reserving Claude Code sessions for complex, stateful work:

| Task Type | Route | Rationale |
|-----------|-------|-----------|
| Extract ideas from a video | Fabric → Ollama (local) | Privacy, zero cost |
| Summarize a meeting transcript | Fabric → Gemini Flash | Fast, cheap |
| Threat model analysis | Fabric → Claude Sonnet | Needs reasoning quality |
| Full feature implementation | Claude Code → Opus | Needs statefulness, tool use |
| Quick commit message | Fabric → Haiku | Trivial task |

**Integration point:** The `--strategy` flag adds reasoning depth (Chain of Thought, Tree of Thought) to any model, partially compensating for using smaller models on analytical tasks.

### 4.7 REST API as a Hook Backend

**Current state:** Framework hooks (`quality-before-commit.sh`, `format-after-edit.sh`, etc.) execute shell scripts. These scripts run deterministic tools (gitleaks, ruff, biome) but cannot invoke AI analysis without spinning up a full Claude Code session.

**Fabric enhancement:** Run `fabric --serve` as a local service. Hooks could POST to Fabric's REST API for lightweight AI-assisted analysis:

```bash
# In a hook script: quick AI review of staged changes
git diff --staged | curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"pattern": "review_code", "model": "ollama/codellama"}' \
  | jq -r '.choices[0].message.content'
```

**Caveat:** This adds latency to hooks. Only suitable for `PostToolUse` hooks or optional pre-push checks, not the <5-second Tier 1 pre-commit gate. The `serveOllama` mode could be particularly useful here, as it allows local-only inference with no API costs or network latency.

---

## 5. Integration Architecture

### Recommended Topology

```
┌─────────────────────────────────────────────────────┐
│                   Developer Terminal                  │
│                                                       │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │   Claude Code    │      │       Fabric CLI      │  │
│  │  (Agentic, SDLC) │      │  (One-shot, Analysis) │  │
│  │                   │      │                        │  │
│  │  Rules, Agents,   │◄────│  Pre-processed inputs  │  │
│  │  Skills, Hooks,   │     │  (summaries, threat     │  │
│  │  Specs, Tasks     │     │   models, extractions)  │  │
│  │                   │     │                          │  │
│  │  Claude Only      │     │  20+ AI Providers       │  │
│  └─────────────────┘      └──────────────────────┘  │
│           │                          │                │
│           ▼                          ▼                │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │  .specify/       │      │  Custom Patterns      │  │
│  │  .claude/        │      │  ~/dotfiles/fabric/   │  │
│  │  Project files   │      │  patterns/            │  │
│  └─────────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Boundary rule:** Fabric handles stateless, single-shot transformations. Claude Code handles stateful, multi-step development. Fabric outputs feed into Claude Code as artifacts, never the reverse.

### Installation as a Dotfiles Package

Fabric configuration could be managed alongside the framework via GNU Stow:

```
~/dotfiles/
├── claude/           # AI Development Framework (existing)
│   └── .claude/
└── fabric/           # Fabric patterns and config (new)
    └── .config/
        └── fabric/
            └── patterns/
                ├── fw_quality_report/system.md
                ├── fw_spec_review/system.md
                ├── fw_security_posture/system.md
                ├── fw_trust_boundaries/system.md
                ├── fw_change_map/system.md
                └── fw_claude_md/system.md
```

---

## 6. Risks and Limitations

| Risk | Mitigation |
|------|------------|
| **Prompt injection via Fabric output** | Fabric output is untrusted input per LLM01 mitigations. Never pipe raw Fabric output into Claude Code as instructions. Save to files, then reference as data. |
| **Pattern quality variance** | 251 patterns vary in quality. Vet patterns before relying on them. Prefer custom patterns for framework-critical tasks. |
| **No quality enforcement** | Fabric has no hooks, Iron Laws, or quality gates. It produces text, not validated artifacts. All Fabric output must pass through the framework's quality pipeline before integration. |
| **API key sprawl** | Multi-provider support means more API keys to manage. Use `fabric --setup` carefully. Never commit `~/.config/fabric/.env`. |
| **Context confusion** | Using two AI tools in parallel could lead to conflicting advice. Maintain clear boundaries: Fabric for pre-processing, Claude Code for development. |
| **Statelessness** | Fabric has no memory between invocations. It cannot learn from project context, previous decisions, or accumulated specifications. It always starts from zero. |

---

## 7. Recommendation

**Adopt Fabric as an optional, complementary utility** — not as a core dependency of the framework.

**Immediate wins (low effort, high value):**
1. Install Fabric and use `extract_wisdom` + `-y` flag for processing conference talks and tutorials
2. Use `summarize_git_diff` for quick commit messages outside Claude Code sessions
3. Use `create_stride_threat_model` as input preparation for the `forensic-specialist` agent
4. Use `create_mermaid_visualization` for quick diagram generation

**Medium-term integration (moderate effort):**
5. Create 3-5 custom patterns aligned with framework conventions (`fw_claude_md`, `fw_trust_boundaries`, `fw_security_posture`)
6. Add Fabric as an optional dotfiles stow package
7. Document the Fabric → Claude Code artifact flow in `agent-workflow.md`

**Experimental (high effort, uncertain value):**
8. Fabric REST API as a hook backend for AI-assisted pre-push checks
9. Ollama compatibility mode for routing framework-adjacent tasks to local models
10. Pattern-based CI pipeline steps (e.g., AI-generated changelogs via `generate_changelog`)

**Do not:**
- Replace any framework agent, skill, or command with Fabric equivalents. Fabric lacks the statefulness, quality enforcement, and governance that the framework provides.
- Pipe Fabric output directly into Claude Code system prompts. Always save to files first and treat as data.
- Add Fabric as a required dependency. It should remain optional for developers who want the additional utility belt.

---

## 8. Practical Usage Guide: How Fabric Enhances Each Framework Phase

This section maps concrete Fabric workflows to each phase of the AI Development Framework's 4-phase, 18-step pipeline.

### 8.1 Phase 1: Planning & Context (Steps 1-4) — Pre-Processing Layer

Fabric's highest value is as a **context preparation tool** that runs *before* a Claude Code session begins, producing token-efficient artifacts that the framework's planning steps can consume directly.

#### Knowledge Distillation

Instead of loading raw documentation, videos, or papers into the context window, Fabric distills them first:

```bash
# Distill a 2-hour conference talk into structured notes
fabric -y "https://youtube.com/watch?v=..." -p extract_wisdom -o .specify/research/talk-notes.md

# Summarize API docs before referencing in a spec
fabric -u "https://docs.example.com/api/v2" -p summarize -o docs/api-summary.md

# Pre-analyze a research paper before /speckit.brainstorm
cat paper.pdf | fabric -p summarize_paper -o .specify/research/paper-summary.md

# Condense competitor/reference project README for context
fabric -u "https://github.com/some/project" -p summarize -o .specify/research/reference-project.md
```

This directly supports the WISC framework (documented in the Context Engineering report):
- **Select** — Fabric extracts only high-signal content from large sources
- **Compress** — Summaries are 10-50x smaller than raw sources, preserving context budget for implementation

#### Pre-Brainstorm Analysis

Before entering `/speckit.brainstorm`, use Fabric to prepare structured inputs:

```bash
# Analyze competing design approaches
cat design-options.md | fabric -p analyze_claims -o .specify/research/approach-analysis.md

# Extract requirements from a product brief
cat product-brief.md | fabric -p extract_recommendations -o .specify/research/requirements-draft.md

# Find logical gaps in an existing proposal
cat proposal.md | fabric -p find_logical_fallacies -o .specify/research/proposal-gaps.md

# Rate existing spec quality before refinement
cat .specify/specs/feature/spec.md | fabric -p rate_content
```

These outputs feed into the `.specify/specs/<branch>/research.md` artifact, giving `/speckit.specify` and `/speckit.plan` richer starting context without consuming Claude Code tokens on preliminary analysis.

### 8.2 Phase 2: Implementation with Quality Gates (Steps 5-10) — Security Artifact Generation

During implementation, Fabric generates security artifacts that the framework's agents and skills consume.

#### Threat Modeling and Security Rules

```bash
# Generate STRIDE threat model → input for forensic-specialist agent
cat docs/architecture.md | fabric -p create_stride_threat_model > .specify/security/threat-model.md

# Write Semgrep rules from vulnerability descriptions
echo "SQL injection via unsanitized user input in Go net/http handlers" | \
  fabric -p write_semgrep_rule -m claude-sonnet-4-5 -V anthropic > .semgrep/custom-rules/sqli-http.yaml

# Generate Nuclei scanner templates for infrastructure testing
echo "Check for exposed admin panels on port 8080" | \
  fabric -p write_nuclei_template_rule > nuclei-templates/admin-panel.yaml

# Generate Sigma detection rules from incident reports
cat incident-report.md | fabric -p create_sigma_rules > sigma-rules/incident-2026-04.yml

# Analyze a CVE advisory before feeding to forensic-specialist
fabric -u "https://advisory-url/CVE-2026-XXXX" -p analyze_threat_report > threat-summary.md

# Generate security design questions for a new feature
cat .specify/specs/feature/spec.md | fabric -p ask_secure_by_design_questions
```

**How this connects to the framework:**
- The `security-review` skill (Step 10) can reference Fabric-generated Semgrep rules during its SAST pass
- The `forensic-specialist` agent can consume threat models and Sigma rules as input artifacts
- The `quality-guardian` agent's security assessment step benefits from pre-generated threat context
- Custom Semgrep rules written by Fabric augment the framework's Tier 1 pre-commit security scanning

#### Visualization During Implementation

```bash
# Generate architecture diagrams from plan artifacts
cat .specify/specs/feature/plan.md | fabric -p create_mermaid_visualization

# Create concept maps for complex domain logic
cat .specify/specs/feature/spec.md | fabric -p create_conceptmap

# Generate Excalidraw diagrams for whiteboard discussions
cat docs/architecture.md | fabric -p create_excalidraw_visualization
```

### 8.3 Phase 3: Review & Integration (Steps 11-16) — Git Workflow Augmentation

For git operations that don't warrant a full Claude Code agent session:

```bash
# Quick commit message from staged changes (outside Claude Code)
git diff --staged | fabric -p summarize_git_diff

# Draft PR description for review-coordinator to refine
git log main..HEAD --oneline | fabric -p write_pull-request

# Summarize what changed in a feature branch
git diff main...HEAD | fabric -p summarize_git_changes

# Quick code review of a colleague's changes (not your own feature)
git diff main...feature-branch | fabric -p review_code

# Explain complex code to a reviewer
cat src/complex-module.go | fabric -p explain_code
```

**Boundary with framework agents:**
- Fabric handles **quick drafts** and **standalone reviews** outside Claude Code
- The `review-coordinator` agent handles the **full PR lifecycle** (creation, reviewer assignment, feedback integration, merge)
- The `code-reviewer` agent handles **deep two-stage reviews** (spec compliance + code quality)
- Fabric output can serve as a starting draft that framework agents refine within a session

### 8.4 Phase 4: Post-Implementation (Steps 17-18) — Retrospective Support

```bash
# Summarize what was learned during a sprint
cat sprint-notes.md | fabric -p extract_insights -o retrospective-insights.md

# Extract patterns from a post-mortem
cat incident-postmortem.md | fabric -p extract_recommendations -o lessons-learned.md

# Analyze logs from a production incident
cat production.log | fabric -p analyze_logs
```

### 8.5 Cross-Phase: Multi-Model Cost Optimization

Fabric's multi-provider routing enables cost-conscious task distribution:

| Task | Fabric Route | Cost | Why Not Claude Code |
|------|-------------|------|---------------------|
| Summarize a meeting recording | `fabric -p summarize_meeting -V google -m gemini-flash` | ~$0.001 | Stateless, no tool use needed |
| Extract ideas from a YouTube talk | `fabric -y <url> -p extract_wisdom -V ollama -m llama3` | $0.00 (local) | Privacy-sensitive, zero cost |
| Quick commit message | `fabric -p summarize_git_diff -V anthropic -m claude-haiku` | ~$0.0005 | Trivial task, sub-second |
| Threat model analysis | `fabric -p create_stride_threat_model -V anthropic -m claude-sonnet` | ~$0.01 | Needs quality but not statefulness |
| Diagram generation | `fabric -p create_mermaid_visualization -V openai -m gpt-4o-mini` | ~$0.001 | Structured output, any model works |
| Full feature implementation | **Claude Code → Opus** | Variable | Needs statefulness, tool use, quality gates |

The `--strategy` flag adds reasoning depth (Chain of Thought, Tree of Thought) to compensate when using smaller models on analytical tasks:
```bash
# Boost a small model's reasoning on a complex analysis
cat architecture.md | fabric -p create_stride_threat_model --strategy tot -V ollama -m llama3
```

### 8.6 Cross-Phase: Custom Pattern Library

The highest-leverage long-term integration is creating **custom Fabric patterns** that speak the framework's language:

| Custom Pattern | What It Generates | Framework Integration Point |
|----------------|-------------------|----------------------------|
| `fw_claude_md` | CLAUDE.md skeleton with change maps, guardrails, trust boundaries, security posture | Follows CLAUDE.md Template Guidance from `agent-workflow.md` |
| `fw_trust_boundaries` | Trust boundary documentation from architecture docs | Populates the Trust Boundary Documentation section |
| `fw_security_posture` | Security posture statement calibrated to app type | Populates the Security Posture Statement section |
| `fw_change_map` | Cross-cutting change maps from import/dependency analysis | Populates the Cross-Cutting Change Maps section |
| `fw_quality_report` | Structured quality gate report in framework format | Standardizes quality-guardian output |
| `fw_spec_review` | Spec analysis against framework's spec template conventions | Pre-validates before `/speckit.review` |

These patterns would live in `~/dotfiles/fabric/patterns/` managed via GNU Stow alongside the framework:

```
~/dotfiles/
├── claude/           # AI Development Framework (existing)
│   └── .claude/
└── fabric/           # Fabric custom patterns (new)
    └── .config/
        └── fabric/
            └── patterns/
                ├── fw_claude_md/system.md
                ├── fw_trust_boundaries/system.md
                ├── fw_security_posture/system.md
                ├── fw_change_map/system.md
                ├── fw_quality_report/system.md
                └── fw_spec_review/system.md
```

### 8.7 Experimental: REST API as Hook Backend

Run `fabric --serve` as a persistent local service. Framework hooks could POST to it for lightweight AI-assisted analysis without spinning up a full Claude Code session:

```bash
# In a PostToolUse hook: quick AI review of edited file
cat "$EDITED_FILE" | curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"pattern": "review_code", "model": "ollama/codellama"}' \
  | jq -r '.choices[0].message.content'
```

The `--serveOllama` mode is particularly interesting here — it exposes patterns as Ollama-compatible "models", enabling local-only inference with zero API costs or network latency.

**Constraints:**
- Only viable for `PostToolUse` hooks or optional pre-push checks
- **Not** for the <5-second Tier 1 pre-commit gate (adds too much latency)
- Ollama inference time depends on hardware — GPU recommended for acceptable hook latency
- Hook output should be informational (exit 0), not blocking (exit 2), to avoid slowing the developer loop

---

## 9. The Boundary Rule

**Fabric = stateless pre-processing. Claude Code = stateful development.**

```
Fabric output  ──save to file──►  .specify/ or docs/  ──read as data──►  Claude Code session
                    │                                                           │
                    │         NEVER pipe directly as instructions               │
                    └───────────────── ✕ ──────────────────────────────────────┘
```

Fabric output always flows *into* the framework as data files. Per the framework's LLM01 mitigations (prompt injection defense), all external input — including Fabric output — must be treated as untrusted data. Save to files first, then reference within Claude Code sessions.

This boundary preserves the framework's governance model:
- **Hooks** still enforce deterministic quality gates
- **Iron Laws** still govern verification and debugging
- **Quality-guardian** still validates before integration
- Fabric adds breadth (more patterns, more providers, more input sources) without undermining depth (statefulness, quality enforcement, governance)
