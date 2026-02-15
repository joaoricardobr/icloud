#!/bin/bash

# Configuration
PROJECT_ROOT="/home/ricardo/Transferências/CloudLocal2026"
CLOUDFLARED_BIN="$PROJECT_ROOT/cloudflared"
LOG_FILE="$PROJECT_ROOT/tunnel.log"
UPDATE_SCRIPT="$PROJECT_ROOT/backend/src/scripts/update-api-url.js"

echo "🚀 Starting Cloudflare Tunnel Wrapper..."

# cleanup old log
rm -f "$LOG_FILE"
touch "$LOG_FILE"

# Start cloudflared in background
"$CLOUDFLARED_BIN" tunnel --url http://localhost:3001 --protocol http2 > "$LOG_FILE" 2>&1 &
PID=$!

echo "⏳ Waiting for Tunnel URL..."

# Loop to find URL
MAX_RETRIES=30
COUNT=0
FOUND_URL=""

while [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    # Grep the log for the URL
    URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$LOG_FILE" | head -n 1)
    
    if [ ! -z "$URL" ]; then
        if [ "$URL" != "$FOUND_URL" ]; then
            FOUND_URL="$URL"
            echo "✅ Tunnel URL Found: $FOUND_URL"
            
            # Execute the update script
            echo "🔄 Updating Firestore..."
            cd "$PROJECT_ROOT/backend"
            # Use node to run the script. Ensure dependencies are acceptable if using src
            if [ -f "$UPDATE_SCRIPT" ]; then
                 node "$UPDATE_SCRIPT" "$FOUND_URL/api/cloud"
            else
                 echo "❌ Update script not found at $UPDATE_SCRIPT"
            fi
            
            # Break loop but keep script running
            break
        fi
    fi
    COUNT=$((COUNT+1))
done &

# Wait for the process to exit (blocking)
wait $PID
