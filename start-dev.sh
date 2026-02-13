#!/bin/bash

# CloudDesk - Script de Inicialização
# Inicia o backend e o frontend simultaneamente

echo "🚀 Iniciando CloudDesk..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verifica se o backend já está rodando
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Backend já está rodando na porta 3001${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${BLUE}🔧 Iniciando Backend (porta 3001)...${NC}"
    cd backend && npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Aguarda o backend iniciar
    sleep 3
    
    # Verifica se o backend está rodando
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ Backend iniciado com sucesso!${NC}"
        BACKEND_RUNNING=true
    else
        echo "❌ Erro ao iniciar o backend. Verifique backend.log"
        cat backend.log | tail -20
        exit 1
    fi
fi

# Verifica se o frontend já está rodando
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Frontend já está rodando na porta 3000${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${BLUE}🎨 Iniciando Frontend (porta 3000)...${NC}"
    cd web && npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Aguarda o frontend iniciar
    sleep 5
    
    # Verifica se o frontend está rodando
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ Frontend iniciado com sucesso!${NC}"
        FRONTEND_RUNNING=true
    else
        echo "❌ Erro ao iniciar o frontend. Verifique frontend.log"
        cat frontend.log | tail -20
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null
        fi
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 CloudDesk está rodando!${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo ""

if [ -f "backend.log" ] || [ -f "frontend.log" ]; then
    echo "📋 Logs disponíveis:"
    [ -f "backend.log" ] && echo "   Backend:  tail -f backend.log"
    [ -f "frontend.log" ] && echo "   Frontend: tail -f frontend.log"
    echo ""
fi

# Se iniciamos processos novos, configurar trap para parar
if [ ! -z "$BACKEND_PID" ] || [ ! -z "$FRONTEND_PID" ]; then
    echo "💡 Para parar os servidores, pressione Ctrl+C"
    echo ""
    
    # Aguarda sinais de interrupção
    trap "echo ''; echo '🛑 Parando servidores...'; [ ! -z \$BACKEND_PID ] && kill \$BACKEND_PID 2>/dev/null; [ ! -z \$FRONTEND_PID ] && kill \$FRONTEND_PID 2>/dev/null; exit 0" INT TERM
    
    # Mantém o script rodando
    wait
else
    echo "💡 Os servidores já estavam rodando. Use Ctrl+C nos terminais originais para pará-los."
    echo ""
fi
