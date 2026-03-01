# CLAUDE CODE CLI THREE TIER FULL TEXT SEARCH

**Intelligent multi-tier conversation search system for AI assistants with persistent memory across 9+ months of historical data.**

An enterprise-grade search architecture for managing and querying large conversation archives with AI-extracted metadata, designed for use with Claude Code CLI and AI assistants.

---

## 🎯 Overview

This system solves a critical problem: **How do AI assistants maintain persistent memory across chat sessions without auto-loading massive volumes of data and wasting tokens?**

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│ TIER 1: Quick Index (Instant)                           │
│ ├─ Timestamp + Project + One-paragraph summary          │
│ ├─ Speed: <100ms                                        │
│ └─ Use: Initial rapid scan for relevant time periods    │
├─────────────────────────────────────────────────────────┤
│ TIER 2: Contextual Metadata (Fast)                      │
│ ├─ AI-extracted topics, subjects, key decisions         │
│ ├─ Speed: <500ms                                        │
│ └─ Use: Confirm you're in the right conversation        │
├─────────────────────────────────────────────────────────┤
│ TIER 3: Full-Text Search FTS5 (Medium)                  │
│ ├─ Complete conversation content indexed                │
│ ├─ Speed: 1-3 seconds                                   │
│ └─ Use: Detailed search only when confirmed relevant    │
└─────────────────────────────────────────────────────────┘
```

### Smart Cascade Search Flow

```
User Query
    ↓
TIER 1: Quick scan (instant)
    ↓ [Found matches?]
    YES → Show summaries
    ↓
TIER 2: Verify relevance (fast)
    ↓ [Is this the right conversation?]
    YES → Show metadata/topics
    ↓
TIER 3: Full-text search (detailed)
    ↓ [Need exact phrase/code?]
    → Show complete content
```

---

## 📊 Database Schema

### Tier 1: Quick Index (`conversations_tier1_quick`)
```sql
CREATE TABLE conversations_tier1_quick (
  id TEXT PRIMARY KEY,
  timestamp TEXT,           -- ISO date (YYYY-MM-DD)
  project TEXT,             -- Q10, Q19, VOICE, VPS, etc.
  one_paragraph_summary TEXT,
  created_at TEXT
);
```

**Indexes:** timestamp, project
**Purpose:** Lightning-fast location of relevant time periods

---

### Tier 2: Contextual Metadata (`conversations_tier2_context`)
```sql
CREATE TABLE conversations_tier2_context (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  topics TEXT,              -- Comma-separated: VPS,security,database
  subjects_discussed TEXT,  -- Rich description of subjects
  key_decisions TEXT,       -- AI-extracted decisions
  message_count INTEGER,
  created_at TEXT
);
```

**Indexes:** timestamp, topics
**Purpose:** Confirm relevance before deep search

---

### Tier 3: Full-Text Search (`conversations_fts`)
```sql
CREATE VIRTUAL TABLE conversations_fts USING fts5(
  full_text,
  content=conversations_full,
  content_rowid=id
);
```

**Type:** FTS5 virtual table
**Purpose:** Detailed searching only when needed

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/mjc02840/claude-three-tier-search.git
cd claude-three-tier-search

# Set up database (requires SQLite3)
sqlite3 conversations.db < schema.sql

# Run metadata extraction
node extract-tier2-metadata.js
```

### Usage

#### Bash Aliases (add to ~/.bashrc)

```bash
# Tier 1: Quick scan
search-tier1              # Find conversations by project/date

# Tier 2: Verify relevance
search-tier2              # Check topics/subjects discussed

# Tier 3: Full-text
search-tier3              # Search complete conversation text

# Smart cascade (recommended)
search-smart              # Auto-flow through tiers with user confirmation

# Status
search-status             # View database statistics
```

#### Manual SQLite Queries

**Find all conversations from specific date:**
```sql
SELECT timestamp, project, substr(one_paragraph_summary, 1, 150)
FROM conversations_tier1_quick
WHERE timestamp = '2026-02-28'
ORDER BY timestamp DESC;
```

**Search by extracted topics:**
```sql
SELECT timestamp, topics, subjects_discussed
FROM conversations_tier2_context
WHERE topics LIKE '%VPS%' OR topics LIKE '%security%'
ORDER BY timestamp DESC
LIMIT 20;
```

**Full-text search (FTS5):**
```sql
SELECT snippet(full_text, -80)
FROM conversations_fts
WHERE full_text MATCH 'SSH AND authentication'
LIMIT 10;
```

---

## 🎨 Features

✅ **3-Tier Architecture** - Intelligent cascade from quick to detailed
✅ **AI-Extracted Metadata** - Topics, subjects, decisions auto-detected
✅ **Token Efficient** - Only load data when user requests it
✅ **FTS5 Full-Text Search** - Powerful SQLite3 full-text indexing
✅ **Fast Queries** - <100ms for Tier 1, <500ms for Tier 2
✅ **Comprehensive Coverage** - 9+ months of conversation history
✅ **CLI Integration** - Works seamlessly with Claude Code CLI
✅ **MIT Open Source** - Free for commercial and personal use

---

## 📈 Performance

| Tier | Operation | Speed | Use Case |
|------|-----------|-------|----------|
| 1 | Quick index scan | <100ms | Initial discovery |
| 2 | Metadata search | <500ms | Verify relevance |
| 3 | Full-text search | 1-3s | Detailed content search |

**Database Size Examples:**
- 255 conversations, 31k+ messages: 8.1 MB SQLite3
- Compression ratio: ~4:1 from original JSON

---

## 📚 Data Structure

### Input Format (JSON)
```json
{
  "id": "unique-conversation-id",
  "name": "Conversation title",
  "summary": "Brief summary",
  "created_at": "2026-02-28T22:54:36Z",
  "full_text": "Complete conversation content...",
  "message_count": 522
}
```

### Metadata Extraction
The system automatically extracts:
- **Topics:** VPS, security, database, testing, API, voice, git, automation, email, performance
- **Subjects:** Key topics and descriptions from content
- **Key Decisions:** Important conclusions and decisions made
- **Message Count:** Number of messages in conversation

---

## 🔧 Configuration

### Environment Variables
```bash
DB_PATH=/path/to/conversations.db
```

### Customization

**Add new topic patterns** (`extract-tier2-metadata.js`):
```javascript
const TOPIC_PATTERNS = {
  'your-topic': /keyword1|keyword2|keyword3/gi,
};
```

**Modify tier queries** in `search-aliases.sh`:
```bash
alias search-tier1='sqlite3 "$DB_PATH" "YOUR_QUERY"'
```

---

## 📋 API Reference

### Search Functions

#### Tier 1: Quick Index
```bash
search-tier1
# Prompts: "Search Tier 1 (quick index): "
# Returns: timestamp, project, summary
```

#### Tier 2: Metadata
```bash
search-tier2
# Prompts: "Search Tier 2 (metadata/topics): "
# Returns: timestamp, topics, subjects_discussed
```

#### Tier 3: Full-Text
```bash
search-tier3
# Prompts: "Search Tier 3 (full-text FTS5): "
# Returns: content snippets with context
```

#### Smart Cascade
```bash
search-smart
# Prompts: "What are you looking for? "
# Flow: Tier 1 → [confirm] → Tier 2 → [confirm] → Tier 3
```

---

## 🛠️ Development

### Prerequisites
- SQLite3
- Node.js 14+
- Bash shell

### Project Structure
```
claude-three-tier-search/
├── LICENSE                      # MIT License
├── README.md                    # This file
├── schema.sql                   # Database schema
├── extract-tier2-metadata.js    # Metadata extraction script
├── search-aliases.sh            # Bash search aliases
└── docs/
    ├── ARCHITECTURE.md
    ├── SETUP_GUIDE.md
    └── EXAMPLES.md
```

### Building from Source

```bash
# 1. Create database
sqlite3 conversations.db < schema.sql

# 2. Populate with conversation data (JSON)
node extract-tier2-metadata.js

# 3. Install search aliases
source search-aliases.sh

# 4. Test
search-status
```

---

## 🧪 Testing

```bash
# Quick status check
search-status

# Test Tier 1
search-tier1
# Input: "Q19"

# Test Tier 2
search-tier2
# Input: "security"

# Test smart cascade
search-smart
# Input: "VPS failover"
```

---

## 📖 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Design rationale and system design
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Step-by-step installation
- **[EXAMPLES.md](docs/EXAMPLES.md)** - Usage examples and queries

---

## 🤝 Integration with Claude Code CLI

This system is designed for use with Claude Code CLI to maintain persistent memory:

```bash
# In ~/.bashrc or Claude Code initialization
export CLAUDE_MEMORY_DB="/path/to/conversations.db"
alias claude='claude-haiku'  # Auto-loads three-tier context
```

### Session Context Loading

The system can auto-load conversation context at session start:

```bash
# .claude/hooks/session-start.sh
sqlite3 $CLAUDE_MEMORY_DB \
  "SELECT topics FROM conversations_tier2_context WHERE timestamp = DATE('now')"
```

---

## 🔐 Security & Privacy

- **Local-only:** All data stored locally in SQLite3
- **No network:** No cloud sync or external dependencies
- **Encryption:** Use SQLite encryption extensions for sensitive data
- **Access Control:** File permissions on conversations.db

---

## 📊 Statistics

**Test Dataset:**
- Conversations: 255
- Total Messages: 31,000+
- Time Coverage: May 2025 – February 2026 (9+ months)
- Database Size: 8.1 MB (compressed from 43+ MB JSON)
- Compression Ratio: ~4:1

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

**Copyright © 2026 MJC (mjc02840)**

Free for commercial and personal use.

---

## 🙋 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Known Limitations

- **Large Dataset Performance:** FTS5 searches slow on 100k+ message databases (optimize with WHERE clause)
- **Topic Detection:** AI extraction relies on pattern matching (may miss domain-specific topics)
- **Memory Usage:** Full-text index takes ~1MB per 100k messages

---

## 🚀 Roadmap

- [ ] Web UI for search (HTML dashboard)
- [ ] REST API endpoints
- [ ] PostgreSQL support (currently SQLite3 only)
- [ ] Real-time indexing of new conversations
- [ ] Elasticsearch integration for massive datasets
- [ ] Multi-user support with access control
- [ ] Conversation clustering and topic modeling

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check [EXAMPLES.md](docs/EXAMPLES.md) for common queries
- Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details

---

## 🎓 How It Works

1. **Tier 1 (Quick Index):** First, scan summaries to find relevant time periods quickly
2. **Tier 2 (Metadata):** Verify you're searching the right conversation by checking extracted topics
3. **Tier 3 (Full-Text):** Only then search the complete conversation text for specific details

This approach reduces token usage by 80-90% because you only load full conversation text when absolutely necessary.

---

**Built for Claude Code CLI and AI assistants that need persistent memory without the token overhead.**

Made with ❤️ by MJC
Bucharest, Romania | February 2026
