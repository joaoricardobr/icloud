#!/bin/bash

# CloudDesk Ultra Sync 🚀
# Este script automatiza TUDO: Inicia túnel, extrai URL, atualiza código e faz deploy.

PROJECT_ROOT="/home/ricardo/Transferências/CloudLocal2026"
CLOUDFLARED_BIN="$PROJECT_ROOT/cloudflared"
API_FILE="$PROJECT_ROOT/web/lib/api.ts"

echo "🧹 Limpando processos e logs antigos..."
pm2 delete clouddesk-tunnel 2>/dev/null
rm -f "$PROJECT_ROOT/tunnel.log"
touch "$PROJECT_ROOT/tunnel.log"

echo "🔍 Iniciando túnel Cloudflare no PM2..."
pm2 start "./cloudflared tunnel --url http://localhost:3001 --protocol http2" --name clouddesk-tunnel --log tunnel.log

echo "⏳ Aguardando URL do túnel ser gerada..."
MAX_RETRIES=15
COUNT=0
TUNNEL_URL=""

while [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    TUNNEL_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" tunnel.log | tail -n 1)
    if [ ! -z "$TUNNEL_URL" ]; then
        break
    fi
    COUNT=$((COUNT+1))
    echo "  (Tentativa $COUNT/$MAX_RETRIES...)"
done

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Erro: Não foi possível obter o URL do túnel após aguardar."
    echo "DICA: Verifique 'pm2 logs clouddesk-tunnel' para ver o erro."
    exit 1
fi

echo "✅ Túnel Ativo: $TUNNEL_URL"

echo "📝 Atualizando $API_FILE..."
# Escapa a URL para o sed
ESCAPED_URL=$(echo "$TUNNEL_URL/api/cloud" | sed 's/\//\\\//g')
# Atualiza tanto DEFAULT_API_URL quanto baseURL literal se existirem
sed -i "s|DEFAULT_API_URL = \".*\"|DEFAULT_API_URL = \"$ESCAPED_URL\"|" "$API_FILE"
sed -i "s|baseURL: \".*\"|baseURL: \"$ESCAPED_URL\"|" "$API_FILE"

echo "🔥 Atualizando Firestore com a nova URL..."
cd "$PROJECT_ROOT/backend"
node src/scripts/update-api-url.js "$TUNNEL_URL/api/cloud"

echo "📦 Fazendo push para o GitHub (Disparando Vercel)..."
cd "$PROJECT_ROOT"
git add "$API_FILE" vercel-sync.sh
git commit -m "🌐 Auto-Sync & CORS Fix: $TUNNEL_URL"
git push origin main

echo "🚀 TUDO PRONTO! O site será atualizado na Vercel em instantes."
echo "🔗 URL da API: $TUNNEL_URL/api/cloud"
