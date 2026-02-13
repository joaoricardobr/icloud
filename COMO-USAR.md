# CloudDesk - Como Usar

## ✅ Servidores Já Estão Rodando!

Seus servidores já estão ativos e funcionando:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 🌐 Acessar a Aplicação

Simplesmente abra seu navegador e acesse:

```
http://localhost:3000
```

## 📊 Status dos Servidores

Para verificar se os servidores estão rodando:

```bash
lsof -i :3000 -i :3001
```

## 🛑 Parar os Servidores

Os servidores estão rodando nos terminais que você abriu. Para pará-los:

1. Vá para os terminais onde executou `npm run dev`
2. Pressione `Ctrl+C` em cada um

Ou force parar com:

```bash
# Parar frontend
lsof -ti:3000 | xargs kill -9

# Parar backend
lsof -ti:3001 | xargs kill -9
```

## 🚀 Iniciar Novamente (se necessário)

Se os servidores não estiverem rodando, use:

```bash
# Opção 1: Script automático
./start-dev.sh

# Opção 2: Manual em terminais separados
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd web && npm run dev
```

## 📝 Ver Logs

Se você iniciou com o script `start-dev.sh`:

```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log
```

## 🎨 O Que Você Verá

Ao acessar http://localhost:3000, você verá:

- ✨ Design moderno com gradientes e animações
- 💾 Cards dos seus discos reais (Sistema e Externo)
- 📁 Cards de categorias (Imagens, Vídeos, Músicas, Documentos)
- 🎭 Sidebar com navegação animada
- 🔍 Barra de busca e ações (Upload, Nova Pasta)

## 🐛 Problemas?

Se algo não funcionar:

1. **Verifique se os servidores estão rodando**:
   ```bash
   lsof -i :3000 -i :3001
   ```

2. **Verifique os logs do backend**:
   ```bash
   cd /home/ricardo/Transferências/CloudLocal2026
   cat backend.log
   ```

3. **Reinicie os servidores**:
   - Pare os processos (Ctrl+C ou kill)
   - Execute `./start-dev.sh` novamente

4. **Abra o console do navegador** (F12) para ver erros JavaScript
