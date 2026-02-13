# CloudDesk - Configuração de Autostart

## ✅ Sistema Configurado para Iniciar Automaticamente

Quando você ligar o notebook, o CloudDesk vai iniciar automaticamente!

## 📋 O que foi configurado:

### 1. Script de Autostart
**Arquivo**: `autostart.sh`

O script:
- ✅ Aguarda 10 segundos após o boot
- ✅ Verifica se backend/frontend já estão rodando
- ✅ Inicia backend na porta 3001
- ✅ Inicia frontend na porta 3000
- ✅ Cria logs em `logs/backend-autostart.log` e `logs/frontend-autostart.log`
- ✅ Mostra notificação desktop quando pronto

### 2. Desktop Entry
**Arquivo**: `~/.config/autostart/clouddesk.desktop`

Configuração do sistema para executar o script automaticamente.

---

## 🧪 Como Testar

### Opção 1: Testar o script manualmente
```bash
cd /home/ricardo/Transferências/CloudLocal2026
./autostart.sh
```

### Opção 2: Reiniciar o computador
```bash
sudo reboot
```

Após reiniciar:
1. Aguarde ~15 segundos
2. Abra o navegador
3. Acesse http://localhost:3000
4. ✅ CloudDesk deve estar funcionando!

---

## 📊 Verificar Status

### Ver logs de autostart:
```bash
# Backend
tail -f ~/Transferências/CloudLocal2026/logs/backend-autostart.log

# Frontend
tail -f ~/Transferências/CloudLocal2026/logs/frontend-autostart.log
```

### Verificar se está rodando:
```bash
# Backend (porta 3001)
lsof -i :3001

# Frontend (porta 3000)
lsof -i :3000
```

---

## 🛑 Desabilitar Autostart (se necessário)

Se quiser desabilitar o autostart:

```bash
rm ~/.config/autostart/clouddesk.desktop
```

Para reabilitar:
```bash
cd /home/ricardo/Transferências/CloudLocal2026
chmod +x autostart.sh
cp clouddesk.desktop ~/.config/autostart/
```

---

## 🔧 Solução de Problemas

### Servidores não iniciam

1. **Verificar logs**:
   ```bash
   cat ~/Transferências/CloudLocal2026/logs/backend-autostart.log
   cat ~/Transferências/CloudLocal2026/logs/frontend-autostart.log
   ```

2. **Iniciar manualmente**:
   ```bash
   cd ~/Transferências/CloudLocal2026
   ./start-dev.sh
   ```

### Portas já em uso

Se as portas 3000 ou 3001 já estiverem em uso:

```bash
# Parar processos
pkill -f "next dev"
pkill -f "node.*backend"

# Reiniciar
./autostart.sh
```

---

## 📝 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| [`autostart.sh`](file:///home/ricardo/Transferências/CloudLocal2026/autostart.sh) | Script principal de autostart |
| `~/.config/autostart/clouddesk.desktop` | Configuração do sistema |
| `logs/backend-autostart.log` | Log do backend |
| `logs/frontend-autostart.log` | Log do frontend |

---

## ✅ Benefícios

- 🚀 **Sem configuração manual** - Liga e funciona
- 🔄 **Sempre atualizado** - Usa o código mais recente
- 📊 **Logs completos** - Fácil debug se necessário
- 🔔 **Notificação visual** - Sabe quando está pronto
- ⚡ **Rápido** - Inicia em ~15 segundos

---

## 🎯 Próximos Passos

1. **Teste agora**: Execute `./autostart.sh` para testar
2. **Reinicie**: `sudo reboot` para testar o autostart
3. **Verifique**: Acesse http://localhost:3000 após boot
4. **Pronto!** Nunca mais precisa iniciar manualmente

---

## 💡 Dica

Se você quiser ver a notificação desktop funcionando, instale o `libnotify`:

```bash
sudo apt install libnotify-bin
```

Depois, quando o sistema iniciar, você verá uma notificação:
> **CloudDesk**  
> Sistema iniciado! Acesse http://localhost:3000
