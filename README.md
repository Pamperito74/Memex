# Memex v4.0

**Extended Memory for Claude - 94-98% Token Savings**

Ultra-efficient knowledge system that remembers your project context across sessions.

---

## Quick Start

```bash
# 1. Setup (one-time)
cd ~/code/cirrus/DevOps/Memex
node scripts/memex-loader.js startup

# 2. Save a session
./scripts/remember "Implemented feature X" --topics feature,x

# 3. Query anytime
node scripts/memex-loader.js quick "commit format"
```

**See [QUICKSTART.md](QUICKSTART.md) for details**

---

## What Makes Memex Special?

### 🎯 **94-98% Token Savings**
- Loads 4KB index vs 500KB docs
- Most queries: 1,000 tokens vs 50,000
- **Saves ~$35/month** on Claude API costs

**See [HOW-MEMEX-SAVES-TOKENS.md](HOW-MEMEX-SAVES-TOKENS.md) for details**

### ⚡ **Instant Performance**
- Startup: <50ms
- Bloom filter: 0.1ms negative lookups (500-1000x faster)
- Lazy loading: Only fetch what you need
- Smart caching: Persistent SQLite + hot/warm tiers

### 🤖 **Zero-Effort Capture**
- Git hooks: Auto-save sessions on commit
- Auto-detect: Topics from files and commit type
- Background: Non-blocking, zero delay

### 🧠 **AI-Powered Search**
- Semantic: Find by meaning, not just keywords
- "auth work" → finds OAuth, JWT, SSO sessions
- 384-dimensional embeddings (all-MiniLM-L6-v2)

---

## How It Works

```
Question → Bloom Filter → Index → Full Details
           ↓              ↓         ↓
           "NO!" (0 tok)  Summary   Complete
           ↓              (1K tok)  (1.1K tok)
           STOP           ↓
                         80% stop here!
```

**Three smart layers:**
1. **Bloom Filter** (243 bytes): Instant "NO" answers
2. **Index** (4KB): Quick summaries, 80% of queries answered
3. **Full Details** (on-demand): Loaded only when needed

---

## Architecture

```
Memex/
├── index.json                    # 4KB - Load first
│   ├── Global standards (quick_ref)
│   ├── Projects metadata
│   └── Topics index
│
├── summaries/projects/           # Lightweight indexes
│   └── CirrusTranslate/
│       ├── sessions-index.json   # Session summaries
│       └── sessions/             # Full details (lazy loaded)
│
└── scripts/
    ├── memex-loader.js          # Main loader
    ├── remember                 # Save sessions
    ├── lazy-loader.js           # Phase 1: Lazy loading
    ├── bloom-filter.js          # Phase 1: Bloom filter
    └── git-hook-capture.sh      # Phase 1: Git hooks
```

---

## Common Usage

### Save Sessions

```bash
# Quick save (after git commit - or use git hooks!)
./scripts/remember "Added OAuth2 login" --topics auth,oauth

# Interactive mode
./scripts/remember --interactive

# Or use git hooks (zero effort!)
cd /path/to/your/repo
/path/to/Memex/scripts/git-hook-capture.sh install
# Now every commit auto-saves a session!
```

### Query Memex

```bash
# Quick answers from index (instant)
node scripts/memex-loader.js quick "commit format"

# Search across projects
node scripts/memex-loader.js search docker

# Semantic search (AI-powered)
node scripts/memex-loader.js semantic "authentication work"

# List all projects
node scripts/memex-loader.js list
```

### Phase 1 Tools

```bash
# Lazy loading
node scripts/lazy-loader.js convert  # Convert to lazy format
node scripts/lazy-loader.js stats    # View statistics

# Bloom filter
node scripts/bloom-filter.js build   # Build filter
node scripts/bloom-filter.js check auth  # Instant lookup

# Git hooks
scripts/git-hook-capture.sh install  # Auto-capture on commit
```

---

## Performance

| Metric | Before Memex | With Memex | Improvement |
|--------|--------------|------------|-------------|
| **Tokens/query** | 50,000 | 1,000 | 98% ⬇️ |
| **Startup time** | 1000ms | 46ms | 21x ⚡ |
| **Index size** | 500KB | 4KB | 99% ⬇️ |
| **Negative lookups** | 50-100ms | 0.1ms | 1000x ⚡ |
| **Monthly cost** | $37.50 | $2.25 | $35 💰 |

---

## Features

### Optimizations (Phase 1 - v3.3)
- ✅ **Lazy Loading** (#22): 64% smaller index
- ✅ **Bloom Filters** (#27): 500-1000x faster negative queries
- ✅ **Git Hooks** (#36): Zero-effort session capture

### Core Features (v3.0-3.2)
- ✅ **Incremental Updates**: 100x faster (only load changed files)
- ✅ **Persistent Cache**: SQLite cache survives restarts
- ✅ **Semantic Search**: AI-powered meaning-based search
- ✅ **MessagePack**: 44% smaller files, improved I/O (see [MESSAGEPACK-MIGRATION.md](MESSAGEPACK-MIGRATION.md))
- ✅ **Smart Caching**: Hot + warm + persistent tiers

**See [PHASE-1-OPTIMIZATIONS.md](PHASE-1-OPTIMIZATIONS.md) for Phase 1 details**
**See [ROADMAP-V4.md](ROADMAP-V4.md) for future plans**

---

## How Claude Uses It

```
User: "What's our commit format?"

1. Bloom filter: "commit" exists ✓
2. Load index (4KB)
3. Check quick_ref: "Conventional Commits: <type>(<scope>): <description>"
4. Answer immediately

Cost: 1,000 tokens (vs 50,000)
Time: 2ms
Files loaded: 1 (index only)
```

**80% of queries answered from index alone - no file loading needed!**

---

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[HOW-MEMEX-SAVES-TOKENS.md](HOW-MEMEX-SAVES-TOKENS.md)** - Simple token savings guide
- **[MESSAGEPACK-MIGRATION.md](MESSAGEPACK-MIGRATION.md)** - MessagePack migration guide
- **[PHASE-1-OPTIMIZATIONS.md](PHASE-1-OPTIMIZATIONS.md)** - Latest optimizations
- **[ROADMAP-V4.md](ROADMAP-V4.md)** - Future plans
- **[HOW-IT-WORKS.md](HOW-IT-WORKS.md)** - Technical deep dive
- **[CHEATSHEET.md](CHEATSHEET.md)** - Command reference

---

## Installation

```bash
# Clone/navigate to Memex
cd ~/code/cirrus/DevOps/Memex

# Make scripts executable
chmod +x scripts/*.js scripts/*.sh

# Test it works
node scripts/memex-loader.js startup

# Optional: Add alias
echo 'alias memex="node ~/code/cirrus/DevOps/Memex/scripts/memex-loader.js"' >> ~/.zshrc
source ~/.zshrc
```

---

## Migration

### From v3.x to v4.0 (MessagePack)

```bash
# 1. Migrate to MessagePack (44% smaller files)
node scripts/migrate-to-msgpack.js migrate

# 2. Verify migration
node scripts/migrate-to-msgpack.js verify

# 3. Test loader
node scripts/memex-loader.js startup

# Done!
```

**Backward compatible - rollback anytime:**
```bash
node scripts/migrate-to-msgpack.js rollback
```

**See [MESSAGEPACK-MIGRATION.md](MESSAGEPACK-MIGRATION.md) for detailed guide**

### From v3.2 to v3.3 (Phase 1)

```bash
# 1. Convert to lazy loading
node scripts/lazy-loader.js convert

# 2. Build bloom filter
node scripts/bloom-filter.js build

# 3. Install git hooks (optional)
cd /path/to/your/repo
/path/to/Memex/scripts/git-hook-capture.sh install

# Done!
```

---

## Contributing

Memex is part of the Cirrus DevOps toolkit. Contributions welcome!

- Report issues: https://github.com/Cirrus-Inc/DevOps/issues
- See roadmap: [ROADMAP-V4.md](ROADMAP-V4.md)

---

## Key Benefits

✅ **95-98% token reduction** - Massive cost savings
✅ **<50ms startup** - Instant context loading
✅ **Cross-project** - Learn from all your projects
✅ **Zero-effort** - Git hooks auto-capture sessions
✅ **AI-powered** - Semantic search by meaning
✅ **Smart caching** - Persistent across restarts
✅ **Scalable** - Handle 1000+ sessions efficiently

---

**Memex: Your project's extended memory, optimized for efficiency** 🧠⚡
