#!/bin/bash
# Run Ralph with caffeinate to prevent sleep
# Usage: ./scripts/ralph/run-ralph.sh [--tool amp|claude] [iterations]
#
# Examples:
#   ./scripts/ralph/run-ralph.sh              # Default: amp, 12 iterations
#   ./scripts/ralph/run-ralph.sh 20           # amp, 20 iterations
#   ./scripts/ralph/run-ralph.sh --tool claude 10  # claude, 10 iterations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments - pass them through to ralph.sh
TOOL="amp"
ITERATIONS=12
ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      ARGS+=("--tool" "$2")
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      ARGS+=("$1")
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        ITERATIONS="$1"
      fi
      ARGS+=("$1")
      shift
      ;;
  esac
done

# If no args were parsed, use defaults
if [ ${#ARGS[@]} -eq 0 ]; then
  ARGS=("$ITERATIONS")
fi

echo "🚀 Starting Ralph with caffeinate (Mac won't sleep)"
echo "📁 Project: $PROJECT_DIR"
echo "🔧 Tool: $TOOL"
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
caffeinate -isd ./scripts/ralph/ralph.sh "${ARGS[@]}"

EXIT_CODE=$?

echo ""
echo "========================================"
echo "⏰ Finished: $(date)"
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Ralph completed all tasks!"
else
  echo "⚠️  Ralph stopped (exit code: $EXIT_CODE)"
  echo "   Check scripts/ralph/progress.txt for status"
fi
