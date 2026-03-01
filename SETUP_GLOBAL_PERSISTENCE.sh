#!/bin/bash

# SETUP: Global Persistence of Memory System
# Installs the session-start hook and global memory file
# Run this once to enable persistence across all Claude Code CLI sessions
#
# Usage: bash SETUP_GLOBAL_PERSISTENCE.sh

set -e

echo "=========================================================="
echo "CLAUDE CODE CLI - GLOBAL PERSISTENCE SETUP"
echo "=========================================================="
echo ""

HOOKS_DIR="$HOME/.claude/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Setting up directories..."
mkdir -p "$HOOKS_DIR"

echo "📄 Installing session-start hook..."
if [[ -f "$HOOKS_DIR/session-start.sh" ]]; then
  echo "   Backing up existing session-start.sh..."
  cp "$HOOKS_DIR/session-start.sh" "$HOOKS_DIR/session-start.sh.backup-$(date +%s)"
fi

cp "$SCRIPT_DIR/hooks-session-start.sh" "$HOOKS_DIR/session-start.sh"
chmod +x "$HOOKS_DIR/session-start.sh"
echo "   ✓ session-start.sh installed to $HOOKS_DIR/"

echo ""
echo "📚 Installing global memory template..."
cp "$SCRIPT_DIR/GLOBAL_MEMORY.md.template" "$HOME/.claude/GLOBAL_MEMORY.md"
chmod 644 "$HOME/.claude/GLOBAL_MEMORY.md"
echo "   ✓ GLOBAL_MEMORY.md created at $HOME/.claude/"

echo ""
echo "✅ Setup complete!"
echo ""
echo "=========================================================="
echo "NEXT STEPS:"
echo "=========================================================="
echo ""
echo "1. Close this Claude Code CLI session"
echo "2. Open a NEW chat session (in any directory)"
echo "3. The hook will auto-load:"
echo "   • Three-tier search database (352+ conversations)"
echo "   • haiku-index system"
echo "   • Global memory (GLOBAL_MEMORY.md)"
echo ""
echo "4. You can now ask: 'What were we working on last?'"
echo "   And I will know the answer without you telling me."
echo ""
echo "=========================================================="
