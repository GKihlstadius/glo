#!/bin/bash
# Run Ralph with caffeinate to prevent sleep
# Usage: ./scripts/ralph/run-ralph.sh [iterations]

ITERATIONS=${1:-12}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Starting Ralph with caffeinate (Mac won't sleep)"
echo "📁 Project: $PROJECT_DIR"
echo "🔄 Max iterations: $ITERATIONS"
echo "⏰ Started: $(date)"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

# caffeinate -i = prevent idle sleep
# caffeinate -s = prevent system sleep (on AC power)
# caffeinate -d = prevent display sleep
caffeinate -isd ./scripts/ralph/ralph.sh --tool claude "$ITERATIONS"

echo ""
echo "========================================"
echo "⏰ Finished: $(date)"
echo "✅ Ralph complete!"
