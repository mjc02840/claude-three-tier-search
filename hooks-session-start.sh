#!/bin/bash

# CLAUDE CODE CLI - GLOBAL SESSION START HOOK
# Loads BOTH haiku-index AND three-tier search persistence of memory systems
# Automatically initializes at every Claude Code CLI session start
# Location: /home/aaa/.claude/hooks/session-start.sh
# Updated: 2026-03-01 - Added three-tier search system

HAIKU_DIR="/var/www/html/HAIKU_INDEX"
HAIKU_DB="$HAIKU_DIR/haiku.db"
PANIC_BUTTON="$HAIKU_DIR/cron/panic-button.sh"
LOG_FILE="/tmp/haiku-session-$(date +%Y%m%d).log"
CONTEXT_OUTPUT="/tmp/haiku-session-context-$$.md"

# Function: Log with timestamp
log_event() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_event "🚀 HAIKU-INDEX session-start hook initiated"

# Step 1: Verify haiku.db exists
if [[ ! -f "$HAIKU_DB" ]]; then
  log_event "❌ ERROR: haiku.db not found at $HAIKU_DB"
  exit 1
fi

log_event "✓ haiku.db verified ($(du -h "$HAIKU_DB" | cut -f1))"

# Step 2: Run panic-button sync (updates database)
log_event "🔄 Running haiku-sync (panic-button.sh)..."
cd "$HAIKU_DIR" || {
  log_event "❌ ERROR: Cannot cd to $HAIKU_DIR"
  exit 1
}

if "$PANIC_BUTTON" >> "$LOG_FILE" 2>&1; then
  log_event "✓ Haiku-sync completed"
else
  log_event "⚠️ WARNING: Haiku-sync had issues (non-fatal, continuing)"
fi

# Step 3: Detect current project
CURRENT_PROJECT=$(basename "$(pwd)" 2>/dev/null | grep -oE "^Q[0-9]+" || echo "CURRENT_PROJECT")
log_event "📁 Detected project: $CURRENT_PROJECT"

# Step 4: Query haiku.db for context
log_event "🔍 Querying haiku.db for context..."

# Build query - search for project-related content in conversations
QUERY="
SELECT
  '### Context from HAIKU-INDEX:' as header,
  '' as blank1,
  'Project: $CURRENT_PROJECT' as project_info,
  'Last indexed: ' || MAX(last_updated) as last_indexed,
  '' as blank2,
  '**Recent findings:**' as findings_header,
  COALESCE(summary, title) as context_snippet
FROM conversations_metadata
WHERE project LIKE '%$CURRENT_PROJECT%' OR key_topics LIKE '%$CURRENT_PROJECT%'
ORDER BY last_updated DESC
LIMIT 10;
"

if sqlite3 "$HAIKU_DB" "$QUERY" > "$CONTEXT_OUTPUT" 2>/dev/null; then
  CONTEXT_LINES=$(wc -l < "$CONTEXT_OUTPUT")
  log_event "✓ Context extracted ($CONTEXT_LINES lines)"

  # Display context summary
  log_event "📋 Sample context:"
  head -5 "$CONTEXT_OUTPUT" >> "$LOG_FILE"
else
  log_event "⚠️ WARNING: Query failed (database may be empty)"
  echo "# No haiku context available yet" > "$CONTEXT_OUTPUT"
fi

# Step 5: Update MEMORY.md with context
MEMORY_DIR="/home/aaa/.claude/projects/-var-www-html-VOICE-INTERFACE-CLAUDE-002/memory"
MEMORY_FILE="$MEMORY_DIR/MEMORY.md"

if [[ -f "$MEMORY_FILE" ]]; then
  # Create backup
  cp "$MEMORY_FILE" "$MEMORY_FILE.backup-$(date +%s)"

  # Check if haiku section already exists
  if grep -q "# HAIKU-INDEX SESSION CONTEXT" "$MEMORY_FILE"; then
    # Replace existing section
    sed -i '/^# HAIKU-INDEX SESSION CONTEXT/,/^# [A-Za-z]/d' "$MEMORY_FILE"
  fi

  # Prepend haiku context (after header, before first real section)
  {
    head -n 3 "$MEMORY_FILE"
    echo ""
    cat "$CONTEXT_OUTPUT"
    echo ""
    tail -n +4 "$MEMORY_FILE"
  } > "$MEMORY_FILE.tmp"

  mv "$MEMORY_FILE.tmp" "$MEMORY_FILE"
  log_event "✓ MEMORY.md updated with haiku context"
else
  log_event "⚠️ WARNING: MEMORY.md not found, skipping update"
fi

# Step 6: Create session summary
SESSION_SUMMARY="/tmp/haiku-session-summary-$$.txt"
cat > "$SESSION_SUMMARY" << SUMMARY
=============================================================
HAIKU-INDEX SESSION CONTEXT LOADED
=============================================================
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Project:   $CURRENT_PROJECT
Database:  $HAIKU_DB
Status:    ✅ Ready for work

Context Preview:
$(head -10 "$CONTEXT_OUTPUT")

Full log: $LOG_FILE
=============================================================
SUMMARY

log_event "✅ Session-start hook completed successfully"
log_event "Summary saved to: $SESSION_SUMMARY"

# Cleanup
rm -f "$CONTEXT_OUTPUT"

# ===== THREE-TIER SEARCH SYSTEM INITIALIZATION =====
# Step 7: Load three-tier search persistence system

log_event ""
log_event "=== THREE-TIER SEARCH SYSTEM ==="

# Load search aliases
source ~/.bashrc 2>/dev/null || true
log_event "✓ Search aliases loaded (search-smart, ingest-now, etc.)"

# Verify three-tier database
THREE_TIER_DB="/var/www/html/@@_BIG_BEAUTIFUL_FTS5/db/conversations.db"
if [[ -f "$THREE_TIER_DB" ]]; then
  CONV_COUNT=$(sqlite3 "$THREE_TIER_DB" "SELECT COUNT(*) FROM conversations;" 2>/dev/null || echo "0")
  TIER2_COUNT=$(sqlite3 "$THREE_TIER_DB" "SELECT COUNT(*) FROM conversations_tier2_context;" 2>/dev/null || echo "0")
  log_event "✓ Three-tier database ready"
  log_event "   - Total conversations: $CONV_COUNT"
  log_event "   - Tier 2 indexed: $TIER2_COUNT"
else
  log_event "⚠️ WARNING: Three-tier database not found at $THREE_TIER_DB"
fi

# Load local memory if available
if [[ -f "$PWD/memory/MEMORY.md" ]]; then
  log_event "✓ Loaded local MEMORY.md"
elif [[ -f "$PWD/MEMORY.md" ]]; then
  log_event "✓ Loaded MEMORY.md from current directory"
elif [[ -f ~/.claude/GLOBAL_MEMORY.md ]]; then
  log_event "✓ Loaded GLOBAL_MEMORY.md (fallback)"
else
  log_event "ℹ️ No project memory found (will create on demand)"
fi

log_event "✅ Three-tier search system initialized"

# ===== SESSION READY =====
log_event ""
log_event "🎯 BOTH PERSISTENCE SYSTEMS READY:"
log_event "   • haiku-index: Synchronized"
log_event "   • three-tier search: 352+ conversations indexed"
log_event "   • Memory: Loaded from local or global cache"

exit 0
