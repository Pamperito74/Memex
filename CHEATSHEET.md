# Memex Cheat Sheet

---

## ✅ Setup Complete!

Aliases added to `~/.zshrc`. **Restart your terminal** or run:

```bash
source ~/.zshrc
```

---

## 📝 Basic Commands

### From ANY Cirrus Repository

```bash
# See full context for current project
memex startup

# Quick answer (instant, no file loading)
memex quick "commit format"
memex quick "pr requirements"
memex quick "branching"

# Search across all projects
memex search authentication
memex search "rate limiting"

# List all projects in Memex
memex list
```

### Save Your Work

```bash
# Quick save
save-session "Implemented OAuth2 authentication" --topics auth,oauth,google

# Interactive mode (asks for summary, topics, notes)
save-session --interactive

# Or just
save-session
```

---

## 🎯 Real Examples

### When you start work:

```bash
cd ~/code/cirrus/CirrusTranslate
memex startup
```

Output:
```
✅ Memex Ready (48ms)
📊 Context Loaded:
  • Global Standards: 5 (commit, PR, branching, code, security)
  • Current Project: CirrusTranslate
  • Available Projects: 3
```

### Quick questions:

```bash
memex quick "commit"
```

Output:
```json
{
  "format": "<type>(<scope>): <description>",
  "example": "feat(auth): add OAuth2 login",
  "types": {
    "feat": "New feature",
    "fix": "Bug fix",
    ...
  }
}
```

### After completing work:

```bash
save-session "Added rate limiting to API endpoints" --topics api,rate-limiting,redis
```

Output:
```
✅ Session saved: ct-2025-11-29-api
✓ Changes committed to Memex
✓ Pushing to remote (background)...
```

---

## 🔍 Search Examples

```bash
# Find authentication implementations
memex search auth

# Find all projects using Redis
memex search redis

# Find specific implementations
memex search "rate limiting"
```

---

## 💡 Pro Tips

**1. Use from ANY repo:**
```bash
cd ~/code/cirrus/CirrusTranslate
save-session "Did something"   # ✅ Works

cd ~/code/cirrus/CirrusAuth
save-session "Did something"   # ✅ Also works!
```

**2. Interactive mode for detailed sessions:**
```bash
save-session
# Prompts for everything, including detailed notes
```

**3. Check what was saved:**
```bash
cat $MEMEX/summaries/projects/CirrusTranslate/sessions-index.json | jq .sessions[0]
```

**4. Quick check of all sessions:**
```bash
cat $MEMEX/index.json | jq .projects
```

---

## 🚨 Troubleshooting

**Command not found?**
```bash
# Restart terminal or:
source ~/.zshrc

# Or use full path:
node ~/code/cirrus/DevOps/Memex/scripts/memex-loader.js startup
```

**Can't detect project?**
```bash
# Make sure you're in a git repo:
git remote -v

# Or add .claude/memex.json:
echo '{"memex":true}' > .claude/memex.json
```

---

## 📍 File Locations

- **Memex root:** `~/code/cirrus/DevOps/Memex`
- **Index:** `$MEMEX/index.json`
- **Sessions:** `$MEMEX/summaries/projects/*/sessions-index.json`
- **Full content:** `$MEMEX/content/projects/*/sessions/`

---

## 🎮 Full Command Reference

| Command | What it does |
|---------|--------------|
| `memex startup` | Load full context for current project |
| `memex quick <query>` | Quick answer from index (instant) |
| `memex search <query>` | Search across all projects |
| `memex list` | List all projects in Memex |
| `save-session "summary" --topics a,b,c` | Quick save |
| `save-session --interactive` | Interactive save with prompts |
| `save-session` | Same as --interactive |

---

**Keep this file handy!** 📌
