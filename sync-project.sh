#!/bin/bash
# =============================================================================
# Glo Project Sync Script
# =============================================================================
# Använd detta script på din LOKALA dator för att synkronisera ändringar
# till servern via SSH.
#
# INSTALLATION:
# 1. Ladda ner glo-project.tar.gz från servern
# 2. Packa upp: tar -xzvf glo-project.tar.gz -C ~/glo-project
# 3. Kopiera detta script till ~/glo-project/
# 4. Redigera SSH_* variablerna nedan
# 5. Gör scriptet körbart: chmod +x sync-project.sh
# =============================================================================

# ===== KONFIGURERA DESSA =====
SSH_USER="vibecode"                    # Din SSH-användare
SSH_HOST="din-server.example.com"      # Serverns adress/IP
SSH_PORT="22"                          # SSH-port (standard: 22)
REMOTE_PATH="/home/user/workspace"     # Sökvägen på servern
# =============================

# Lokala projektmappen (samma mapp som scriptet ligger i)
LOCAL_PATH="$(dirname "$0")"

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Glo Project Sync${NC}"
echo "================================"

# Funktion för att ladda upp ändringar till servern
upload() {
    echo -e "${GREEN}⬆️  Laddar upp ändringar till servern...${NC}"
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.expo' \
        --exclude 'bun.lock' \
        --exclude '.git' \
        --exclude '*.log' \
        -e "ssh -p $SSH_PORT" \
        "$LOCAL_PATH/" \
        "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Uppladdning klar!${NC}"
    else
        echo -e "${RED}❌ Uppladdning misslyckades${NC}"
        exit 1
    fi
}

# Funktion för att ladda ner ändringar från servern
download() {
    echo -e "${GREEN}⬇️  Laddar ner ändringar från servern...${NC}"
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.expo' \
        --exclude 'bun.lock' \
        --exclude '.git' \
        --exclude '*.log' \
        -e "ssh -p $SSH_PORT" \
        "$SSH_USER@$SSH_HOST:$REMOTE_PATH/" \
        "$LOCAL_PATH/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nedladdning klar!${NC}"
    else
        echo -e "${RED}❌ Nedladdning misslyckades${NC}"
        exit 1
    fi
}

# Funktion för att övervaka och auto-synka vid ändringar
watch() {
    echo -e "${YELLOW}👀 Övervakar ändringar... (Ctrl+C för att avsluta)${NC}"
    
    # Kolla om fswatch finns
    if command -v fswatch &> /dev/null; then
        fswatch -o "$LOCAL_PATH/src" | while read f; do
            echo -e "${YELLOW}🔄 Ändringar upptäckta, synkar...${NC}"
            upload
        done
    # Eller använd inotifywait på Linux
    elif command -v inotifywait &> /dev/null; then
        while inotifywait -r -e modify,create,delete "$LOCAL_PATH/src"; do
            echo -e "${YELLOW}🔄 Ändringar upptäckta, synkar...${NC}"
            upload
        done
    else
        echo -e "${RED}❌ Varken fswatch eller inotifywait hittades.${NC}"
        echo "Installera fswatch (macOS): brew install fswatch"
        echo "Installera inotify-tools (Linux): apt install inotify-tools"
        exit 1
    fi
}

# Visa hjälp
help() {
    echo "Användning: ./sync-project.sh [kommando]"
    echo ""
    echo "Kommandon:"
    echo "  upload    Ladda upp lokala ändringar till servern"
    echo "  download  Ladda ner ändringar från servern"
    echo "  watch     Övervaka ändringar och auto-synka"
    echo "  help      Visa denna hjälp"
    echo ""
    echo "Exempel:"
    echo "  ./sync-project.sh upload   # Pusha ändringar"
    echo "  ./sync-project.sh download # Hämta ändringar"
    echo "  ./sync-project.sh watch    # Auto-synk vid sparning"
}

# Huvudlogik
case "${1:-help}" in
    upload)
        upload
        ;;
    download)
        download
        ;;
    watch)
        watch
        ;;
    help|*)
        help
        ;;
esac
