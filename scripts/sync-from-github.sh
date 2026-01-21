#!/bin/bash
# =============================================================================
# Glo: GitHub → Vibecode Sync Script
# =============================================================================
# Kör detta script på Vibecode-servern för att hämta senaste ändringar från GitHub
# 
# Användning:
#   ./scripts/sync-from-github.sh          # Synka main branch
#   ./scripts/sync-from-github.sh develop  # Synka specifik branch
# =============================================================================

set -e

BRANCH="${1:-main}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Färger
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${YELLOW}🔄 Synkar GitHub → Vibecode (branch: $BRANCH)${NC}"
echo "=================================================="

# Hämta senaste från GitHub
echo -e "${GREEN}⬇️  Hämtar från GitHub...${NC}"
git fetch github

# Kolla om det finns nya commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse github/$BRANCH 2>/dev/null || echo "NOT_FOUND")

if [ "$REMOTE" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Branch '$BRANCH' finns inte på GitHub${NC}"
    exit 1
fi

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✅ Redan uppdaterad!${NC}"
    exit 0
fi

# Visa vilka commits som kommer
echo ""
echo -e "${YELLOW}📝 Nya commits:${NC}"
git log --oneline HEAD..$REMOTE | head -10

# Merga ändringar
echo ""
echo -e "${GREEN}🔀 Mergar ändringar...${NC}"
git merge github/$BRANCH --no-edit

# Installera dependencies om package.json ändrades
if git diff HEAD~1 --name-only | grep -q "package.json"; then
    echo -e "${GREEN}📦 Installerar dependencies...${NC}"
    bun install
fi

# Pusha till Vibecode
echo -e "${GREEN}⬆️  Pushar till Vibecode...${NC}"
git push origin $BRANCH

echo ""
echo -e "${GREEN}✅ Synkronisering klar!${NC}"
echo "=================================================="
git log --oneline -3
