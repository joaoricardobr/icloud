#!/bin/bash

# CloudDesk Auto-Start Script
# Este script inicia automaticamente o backend e frontend quando o sistema liga

PROJECT_DIR="/home/ricardo/Transferências/CloudLocal2026"
LOG_DIR="$PROJECT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend-autostart.log"
FRONTEND_LOG="$LOG_DIR/frontend-autostart.log"

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Aguardar 10 segundos após boot para garantir que tudo está pronto
sleep 10

log "🚀 Iniciando CloudDesk via PM2..." | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"

# Usar PM2 para gerenciar os processos e garantir que fiquem sempre ativos
if command -v pm2 &> /dev/null; then
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    log "✅ Processos iniciados e salvos no PM2" | tee -a "$BACKEND_LOG"
else
    log "❌ PM2 não encontrado. Instalando..." | tee -a "$BACKEND_LOG"
    npm install -g pm2
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js
    pm2 save
fi

log "🎉 CloudDesk está configurado para manter-se sempre ativo!" | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"
log "📍 Acesse: http://localhost:3000" | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"

# Notificação desktop (opcional)
if command -v notify-send &> /dev/null; then
    notify-send "CloudDesk" "Sistema iniciado! Acesse http://localhost:3000" -i dialog-information
fi
