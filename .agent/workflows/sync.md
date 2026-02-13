---
description: Sincronizar o backend local com o site na Vercel via Cloudflare Tunnel
---

Este workflow automatiza o processo de expor seu computador local para a internet e atualizar o frontend na Vercel com o novo endereço da API.

1. Navegue até a raiz do projeto: `cd /home/ricardo/Transferências/CloudLocal2026`
2. Execute o script de sincronização ultra-rápida:
// turbo
`./vercel-sync.sh`

O script irá:
- Fechar túneis antigos.
- Criar um novo túnel seguro.
- Detectar o novo endereço automaticamente.
- Atualizar o código do frontend (`web/lib/api.ts`).
- Fazer push para o GitHub para disparar o deploy na Vercel.

**Uso Recomendado**: Sempre que você reiniciar seu computador ou se o site na Vercel parar de mostrar seus arquivos, execute este comando.
