# Sistema de Notificações WhatsApp - HORALY

## Visão Geral

O sistema de notificações WhatsApp foi completamente reformulado para:

1. **Persistir a conexão** - Uma vez conectado, permanece conectado até ser explicitamente desconectado
2. **Envio automático de mensagens** - Usando Laravel Queues com Jobs para performance e confiabilidade
3. **Mensagens personalizáveis** - Templates armazenados no banco de dados
4. **Envio instantâneo** - Confirmações são enviadas imediatamente ao finalizar agendamento
5. **Lembretes programados** - Com tempo configurável pelo estabelecimento

## Funcionalidades Implementadas

### 1. Conexão Persistente do WhatsApp

- **Problema resolvido**: Conexão se desconectava ao recarregar a página
- **Solução**: Estado da conexão é persistido no localStorage e verificado periodicamente
- **Localização**: `resources/js/pages/establishment/notifications/Index.tsx`

### 2. Sistema de Jobs (Laravel Queues)

#### Jobs Criados:
- `SendWhatsAppMessage` - Job genérico para envio de mensagens
- `SendAppointmentConfirmation` - Job específico para confirmações (instantâneo)
- `SendAppointmentReminder` - Job específico para lembretes (programado)

#### Localizações:
- `app/Jobs/SendWhatsAppMessage.php`
- `app/Jobs/SendAppointmentConfirmation.php`
- `app/Jobs/SendAppointmentReminder.php`

### 3. Serviço de Notificações

**Arquivo**: `app/Services/AppointmentNotificationService.php`

Responsável por:
- Enviar confirmações instantâneas
- Programar lembretes baseados nas configurações do estabelecimento
- Gerenciar o ciclo de vida das notificações

### 4. Observer de Agendamentos

**Arquivo**: `app/Observers/AppointmentObserver.php`

Automaticamente:
- Envia confirmação quando agendamento é criado/confirmado
- Programa lembrete baseado nas configurações
- Registrado em `app/Providers/AppServiceProvider.php`

### 5. Integração com WhatsAppService

**Arquivo**: `app/Services/WhatsAppService.php`

Melhorias:
- Persistência real do status da conexão no banco
- Verificação automática de status
- Handling melhorado de erros

## Como Usar

### 1. Conectar WhatsApp

1. Acesse `/notifications` no dashboard do estabelecimento
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code
4. A conexão será persistida automaticamente

### 2. Configurar Mensagens

Na página de notificações:
- **Confirmação de Agendamento**: Enviada instantaneamente (não configurável o tempo)
- **Lembrete**: Configure o tempo antes do agendamento (1h até 48h)
- **Outras mensagens**: Boas-vindas, aniversário, promoções, cancelamento

### 3. Variáveis Disponíveis

Nas mensagens, você pode usar:
- `{cliente}` - Nome do cliente
- `{data}` - Data do agendamento (dd/mm/yyyy)
- `{hora}` - Horário do agendamento
- `{servico}` - Nome do serviço
- `{valor}` - Valor do serviço (R$ 00,00)
- `{estabelecimento}` - Nome do estabelecimento
- `{telefone}` - Telefone do estabelecimento

## Configuração de Produção

### 1. Configurar Filas

No `.env`:
```env
QUEUE_CONNECTION=database
```

### 2. Executar Worker da Fila

```bash
php artisan queue:work --daemon --sleep=3 --tries=3
```

### 3. Configurar Evolution API

No `.env`:
```env
EVOLUTION_API_URL=https://sua-api.com
EVOLUTION_API_KEY=sua-chave
EVOLUTION_WEBHOOK_URL=https://seu-site.com/webhooks/whatsapp
```

## Testes

### Testar Notificações

```bash
# Testar com agendamento específico
php artisan test:whatsapp-notifications 123

# Testar com primeiro agendamento confirmado
php artisan test:whatsapp-notifications
```

### Verificar Status da Fila

```bash
# Ver jobs pendentes
php artisan queue:status

# Ver jobs falhados
php artisan queue:failed

# Reprocessar jobs falhados
php artisan queue:retry all
```

## Logs

Todos os eventos são logados:
- Envio de mensagens
- Erros de conexão
- Status dos jobs
- Programação de lembretes

Verifique em `storage/logs/laravel.log`

## Troubleshooting

### 1. Mensagens não são enviadas
- Verificar se o WhatsApp está conectado
- Verificar se as configurações estão habilitadas
- Verificar se o worker da fila está rodando
- Verificar logs para erros

### 2. QR Code não aparece
- Verificar configuração da Evolution API
- Verificar logs do navegador
- Tentar reconectar

### 3. Conexão se perde
- O sistema agora verifica automaticamente a cada 30 segundos
- Se perder conexão, será detectado e o status atualizado
- Para reconectar, basta clicar em "Conectar WhatsApp" novamente

## Arquitetura

```
Agendamento Criado/Atualizado
           ↓
    AppointmentObserver
           ↓
AppointmentNotificationService
           ↓
    Jobs (SendAppointmentConfirmation/Reminder)
           ↓
    Laravel Queue System
           ↓
    WhatsAppService
           ↓
    Evolution API
           ↓
    WhatsApp Business API
```

## Próximos Passos

1. Implementar cancelamento automático de lembretes se agendamento for cancelado
2. Adicionar métricas de entrega de mensagens
3. Implementar templates de mensagem mais avançados
4. Adicionar suporte para mensagens de mídia
5. Implementar sistema de blacklist/whitelist de números