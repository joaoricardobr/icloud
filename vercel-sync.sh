#!/bin/bash

# CloudDesk Ultra Sync 🚀
# Este script automatiza TUDO: Inicia túnel, extrai URL, atualiza código e faz deploy.

PROJECT_ROOT="/home/ricardo/Transferências/CloudLocal2026"
CLOUDFLARED_BIN="$PROJECT_ROOT/cloudflared"
API_FILE="$PROJECT_ROOT/web/lib/api.ts"

echo "🧹 Limpando processos antigos..."
pm2 delete clouddesk-tunnel 2>/dev/null

echo "🔍 Iniciando novo túnel Cloudflare e extraindo URL..."
# Inicia cloudflared, captura a primeira linha que contém o URL e encerra.
TUNNEL_URL=$(./cloudflared tunnel --url http://localhost:3001 --protocol http2 2>&1 | grep -m 1 "https://.*\.trycloudflare\.com" | grep -o "https://.*\.trycloudflare\.com")

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Erro: Não foi possível obter o URL do túnel."
    exit 1
fi

echo "✅ Novo Túnel: $TUNNEL_URL"

# Reinicia no PM2 para manter rodando em background
echo "🔋 Mantendo túnel ativo no PM2..."
pm2 start "./cloudflared tunnel --url http://localhost:3001 --protocol http2" --name clouddesk-tunnel

echo "📝 Atualizando $API_FILE..."
# Escapa a URL para o sed
ESCAPED_URL=$(echo "$TUNNEL_URL/api/cloud" | sed 's/\//\\\//g')
sed -i "s/baseURL: \".*\"/baseURL: \"$ESCAPED_URL\"/" "$API_FILE"

echo "🔥 Atualizando Firestore com a nova URL..."
cd "$PROJECT_ROOT/backend"
# Use plain node for the JS script to be more robust
node src/scripts/update-api-url.js "$TUNNEL_URL/api/cloud"

echo "📦 Fazendo push para o GitHub (Disparando Vercel)..."
cd "$PROJECT_ROOT"
git add "$API_FILE"
git commit -m "🌐 Auto-Sync: $TUNNEL_URL"
git push origin main

echo "🚀 TUDO PRONTO! O site será atualizado na Vercel em instantes."
echo "🔗 URL da API: $TUNNEL_URL/api/cloud"
