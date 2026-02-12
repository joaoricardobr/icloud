#!/bin/bash

# CloudDesk Smart Vercel Sync 🚀
# Este script sincroniza automaticamente o túnel local com o site na Vercel.

echo "🔍 Detectando novo túnel Cloudflare..."
# Extrai o link mais recente dos logs do PM2
TUNNEL_URL=$(pm2 logs clouddesk-tunnel --lines 100 --no-daemon | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -n 1)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Erro: Não foi possível detectar o URL do túnel. Verifique se o PM2 está rodando."
    exit 1
fi

echo "✅ Túnel encontrado: $TUNNEL_URL"

# 🛠️ Atualiza o arquivo web/lib/api.ts com o novo endereço
# Escapa a URL para o sed
ESCAPED_URL=$(echo "$TUNNEL_URL/api/cloud" | sed 's/\//\\\//g')

echo "📝 Atualizando código-fonte..."
sed -i "s/baseURL: process.env.NEXT_PUBLIC_API_URL || \".*\"/baseURL: process.env.NEXT_PUBLIC_API_URL || \"$ESCAPED_URL\"/" web/lib/api.ts

# 📤 Faz o push para o GitHub para disparar o deploy na Vercel
echo "📦 Enviando para o GitHub..."
git add web/lib/api.ts
git commit -m "🔄 Auto-Sync: Atualizando túnel para $TUNNEL_URL"
git push origin main

echo "🚀 Sincronização concluída! A Vercel começará o deploy em alguns segundos."
