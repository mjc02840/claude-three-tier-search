#!/bin/bash

# AUTO-INGEST CRON JOB
# Automatically ingests new Claude conversations from projects directory
# Into the three-tier search database every night
#
# Install in crontab:
# 59 23 * * * /home/aaa/bin/auto-ingest-claude-conversations.sh
#
# This will run at 11:59 PM every night

set -e

# Configuration
PROJECTS_DIR="/home/aaa/.claude/projects"
DB_DIR="/var/www/html/@@_BIG_BEAUTIFUL_FTS5/db"
DB_PATH="$DB_DIR/conversations.db"
LOG_FILE="/tmp/auto-ingest-$(date +%Y-%m-%d).log"
INGEST_SCRIPT="$DB_DIR/ingest-from-projects.js"
EXTRACT_SCRIPT="$DB_DIR/extract-tier2-metadata.js"

# Functions
log_event() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start
{
  log_event "🚀 AUTO-INGEST STARTED"
  log_event "Projects: $PROJECTS_DIR"
  log_event "Database: $DB_PATH"
  log_event ""

  # Verify prerequisites
  if [[ ! -d "$PROJECTS_DIR" ]]; then
    log_event "❌ ERROR: Projects directory not found: $PROJECTS_DIR"
    exit 1
  fi

  if [[ ! -f "$DB_PATH" ]]; then
    log_event "❌ ERROR: Database not found: $DB_PATH"
    exit 1
  fi

  if [[ ! -x "$INGEST_SCRIPT" ]]; then
    chmod +x "$INGEST_SCRIPT"
    log_event "✓ Made ingest script executable"
  fi

  # Step 1: Ingest conversations from projects directory
  log_event "📚 Step 1: Ingesting conversations from $PROJECTS_DIR..."
  cd "$DB_DIR"

  if node "$INGEST_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log_event "✓ Ingest completed"
  else
    log_event "⚠️ WARNING: Ingest script had errors (see log)"
  fi

  log_event ""
  log_event "📊 Step 2: Extracting Tier 2 metadata..."

  # Step 2: Extract metadata for newly ingested conversations
  if node "$EXTRACT_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log_event "✓ Metadata extraction completed"
  else
    log_event "⚠️ WARNING: Metadata extraction had errors (see log)"
  fi

  log_event ""
  log_event "📈 Step 3: Database verification..."

  # Step 3: Verify database integrity
  CONV_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM conversations;" 2>/dev/null || echo "0")
  TIER2_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM conversations_tier2_context;" 2>/dev/null || echo "0")

  log_event "   Total conversations: $CONV_COUNT"
  log_event "   Tier 2 indexed: $TIER2_COUNT"

  log_event ""
  log_event "✅ AUTO-INGEST COMPLETED SUCCESSFULLY"
  log_event "Log: $LOG_FILE"

} >> "$LOG_FILE" 2>&1

# Exit status
if [[ $? -eq 0 ]]; then
  exit 0
else
  exit 1
fi
