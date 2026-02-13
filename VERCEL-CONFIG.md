# Configuração de Variáveis de Ambiente no Vercel

## Problema
O frontend no Vercel está tentando conectar a `localhost:3001`, o que não funciona em produção porque localhost só existe no seu computador local.

## Solução

### Opção 1: Backend Público (Recomendado)

Se você tem um backend público (ex: Railway, Render, Heroku):

1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Selecione seu projeto CloudDesk
3. Vá em **Settings** → **Environment Variables**
4. Adicione uma nova variável:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://seu-backend-url.com/api/cloud`
   - **Environments**: Marque Production, Preview, e Development
5. Clique em **Save**
6. Faça um novo deploy (ou force redeploy)

### Opção 2: Cloudflare Tunnel (Temporário)

Se você quer usar o backend local via Cloudflare Tunnel:

1. No Vercel, adicione a variável:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://cadillac-editions-transaction-plymouth.trycloudflare.com/api/cloud`
   
2. **IMPORTANTE**: O Cloudflare Tunnel precisa estar rodando no seu computador:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

### Opção 3: Backend Serverless no Vercel

Você pode mover o backend para Vercel também:

1. Criar pasta `api/` no projeto web
2. Mover lógica do backend para Serverless Functions
3. Usar `NEXT_PUBLIC_API_URL=/api`

## Como Fazer Deploy Agora

```bash
# 1. Commit as mudanças
git add -A
git commit -m "Add responsive design and environment config"
git push origin main

# 2. Vercel vai fazer deploy automaticamente
# 3. Configure a variável NEXT_PUBLIC_API_URL no painel
# 4. Force um redeploy se necessário
```

## Verificar se Funcionou

Após configurar, acesse seu site no Vercel e abra o console (F12):
- ✅ Deve mostrar: `🔌 CloudDesk API conectando em: https://seu-backend-url.com/api/cloud`
- ❌ NÃO deve mostrar: `localhost:3001`
