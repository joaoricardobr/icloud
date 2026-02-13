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

log "🚀 Iniciando CloudDesk automaticamente..." | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"

# Verificar se já está rodando
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "⚠️  Backend já está rodando na porta 3001" | tee -a "$BACKEND_LOG"
else
    log "▶️  Iniciando backend..." | tee -a "$BACKEND_LOG"
    cd "$PROJECT_DIR/backend" && npm run dev >> "$BACKEND_LOG" 2>&1 &
    sleep 3
    log "✅ Backend iniciado" | tee -a "$BACKEND_LOG"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "⚠️  Frontend já está rodando na porta 3000" | tee -a "$FRONTEND_LOG"
else
    log "▶️  Iniciando frontend..." | tee -a "$FRONTEND_LOG"
    cd "$PROJECT_DIR/web" && npm run dev >> "$FRONTEND_LOG" 2>&1 &
    sleep 5
    log "✅ Frontend iniciado" | tee -a "$FRONTEND_LOG"
fi

log "🎉 CloudDesk está pronto!" | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"
log "📍 Acesse: http://localhost:3000" | tee -a "$BACKEND_LOG" "$FRONTEND_LOG"

# Notificação desktop (opcional)
if command -v notify-send &> /dev/null; then
    notify-send "CloudDesk" "Sistema iniciado! Acesse http://localhost:3000" -i dialog-information
fi
