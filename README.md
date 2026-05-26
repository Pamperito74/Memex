# Engram

<p align="center">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-10b981?style=flat-square&labelColor=18181b"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A520-10b981?style=flat-square&labelColor=18181b">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-native-10b981?style=flat-square&labelColor=18181b">
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux-10b981?style=flat-square&labelColor=18181b">
  <a href="https://github.com/tinydarkforge/Engram/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/TinyDarkForge/Engram/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="https://www.npmjs.com/package/@tinydarkforge/engram"><img alt="npm" src="https://img.shields.io/npm/v/@tinydarkforge/engram?style=flat-square&labelColor=18181b&color=10b981"></a>
</p>

**Engram** is an autonomous memory and assertion ledger for AI coding agents. It persists engineering context across repositories, ranks facts by confidence and corroboration, and surfaces contradictions. Unlike simple RAG, Engram actively **learns** — running background consolidation to refine its knowledge and exposing a high-fidelity context to Claude Code over the Model Context Protocol (MCP).

---

## Quick start

```bash
npm install -g @tinydarkforge/engram
engram setup
claude mcp add engram -s user -- engram mcp
```

Engram is now available as a tool in every Claude Code session. It remembers what you did across every repository, ranks what it knows, and injects a budget-capped slice of context on demand.

---

## How it works

Engram captures engineering work and stores it in two layers:

**Session memory** — Git-hook or manual `engram remember` saves notes, topics, diffs, and test deltas to a per-project index. Every repo on your machine gets its own namespace.

**Assertion ledger** — A SQLite-backed fact store. Every claim records confidence (`0.0–1.0`), status (`tentative → established → fossilized`), quorum count, decay model, lineage, and tension markers.

**Autonomous Intelligence** — Engram runs a background learning loop during consolidation. It automatically detects contradictions (tensions), promotes corroborated facts to established status, and fossilizes outdated knowledge without user intervention.

### Retrieval

Queries traverse four layers, stopping at the earliest one that answers:

| Layer | Size | Latency | Role |
|-------|------|---------|------|
| Bloom filter | 243 B | ~0.1 ms | Instant *"not known"* — zero tokens consumed |
| Session index | ~4 KB | ~10 ms | Compact summaries — answers ~80% of queries |
| Session detail | per-file | ~5 ms | Full content, lazy-loaded on demand |
| Ledger | ~2 KB/fact | 5–15 ms | Ranked facts with confidence, quorum, tension |

Results are packed into a caller-specified token budget using `decay × status × quorum × tension × weight`.

**Semantic search** uses a local ONNX embedding model (`@huggingface/transformers`) that loads lazily on the first semantic query. Text search and keyword recall work without it.

---

## Install

### Global (recommended)

```bash
npm install -g @tinydarkforge/engram
engram setup
```

### From source

```bash
git clone https://github.com/tinydarkforge/Engram.git
cd Engram
npm install
npm run setup
```

### Connect Claude Code

```bash
# Global install
claude mcp add engram -s user -- engram mcp

# Source install  
claude mcp add engram -s user -- node "$(pwd)/scripts/mcp-server.mjs"
```

---

## Usage

```bash
# Save a session
engram remember "Implemented OAuth callback handling" --topics auth,oauth

# Interactive session capture
engram remember --interactive

# Search across all projects
engram semantic "authentication work"
engram search "oauth"

# View status and ledger health
engram status

# Launch the web dashboard
engram start   # → http://127.0.0.1:3000
```

### MCP tools (available in Claude Code)

Engram exposes tools via MCP for session search, ledger ingestion, context selection, cross-project search, and agent handoff. Run `engram mcp` to start the MCP server.

---

## Features

| | Engram | mem0 | Letta / Zep |
|---|---|---|---|
| Local-first (no cloud) | Yes | No | No |
| Assertion ledger (confidence, quorum, status) | Yes | No | No |
| Contradiction detection | Yes | No | No |
| MCP-native (Claude Code) | Yes | No | No |
| Git-hook session capture | Yes | Partial | Partial |
| Token-budgeted retrieval | Yes | No | No |
| Semantic search (local ONNX) | Yes | Yes | Yes |
| Cross-session diff | Yes | No | No |
| Agent handoff | Yes | Limited | Limited |
| MCP Resources with subscriptions | Yes | No | No |

---

## Prerequisites

- **Node.js** `>=20`
- **macOS** or **Linux** (Windows not supported — shell scripts and symlinks)
- **Semantic search** downloads a ~100 MB ONNX embedding model on first query. Keyword search works without it.

---

## Security

- **No network calls** unless you opt in. The embedding model is downloaded once and cached locally. If you never invoke semantic search, nothing is fetched.
- **No telemetry.** Engram never phones home.
- **Local files only.** Session data lives under `~/.engram/summaries/` and the ledger DB in `~/.engram/.cache/engram.db`.
- Reporting vulnerabilities: see [SECURITY.md](SECURITY.md).

---

## Architecture

```
scripts/     Runtime, CLI, MCP servers, ledger, consolidation
web/         Dashboard UI (Express + static files)
tests/       29 test files (node:test)
schemas/     JSON schemas for sessions and ledger
migrations/  SQLite schema migrations
examples/    Curated session records
```

Engram runs two servers:
- **HTTP API + Dashboard** (port 3000) — REST endpoints and web UI
- **MCP server** (port 3001) — Streamable HTTP and stdio transports for Claude Code

Both can run simultaneously. The MCP server accepts optional API key authentication.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center"><a href="https://github.com/tinydarkforge/Engram">GitHub</a> · <a href="mailto:hello@tinydarkforge.com">Contact</a></p>
