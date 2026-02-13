#!/bin/bash

# CloudDesk - Script de Inicialização
# Inicia o backend e o frontend simultaneamente

echo "🚀 Iniciando CloudDesk..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verifica se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Mata processos anteriores nas portas 3000 e 3001
echo "🧹 Limpando processos anteriores..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Inicia o backend
echo -e "${BLUE}🔧 Iniciando Backend (porta 3001)...${NC}"
cd backend && npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguarda o backend iniciar
sleep 3

# Verifica se o backend está rodando
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend iniciado com sucesso!${NC}"
else
    echo "❌ Erro ao iniciar o backend. Verifique backend.log"
    exit 1
fi

# Inicia o frontend
echo -e "${BLUE}🎨 Iniciando Frontend (porta 3000)...${NC}"
cd web && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Aguarda o frontend iniciar
sleep 5

# Verifica se o frontend está rodando
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Frontend iniciado com sucesso!${NC}"
else
    echo "❌ Erro ao iniciar o frontend. Verifique frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 CloudDesk está rodando!${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Para parar os servidores, pressione Ctrl+C"
echo ""

# Aguarda sinais de interrupção
trap "echo ''; echo '🛑 Parando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Mantém o script rodando
wait
