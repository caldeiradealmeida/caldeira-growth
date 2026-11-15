# Contatos do site: proteção, Supabase e alertas

## Fluxo

`/contato` → Turnstile → `POST /api/contact` → transação Supabase → fila de entregas → e-mail, planilha e Chief of Staff.

O servidor valida tamanho, tipos, e-mail, mensagem, hostname e action do Turnstile. Um campo oculto descarta robôs simples. O banco limita a 5 novos contatos por origem e 3 por e-mail em 15 minutos; armazena apenas HMAC da origem na tabela temporária de limites. O request_id mantém a mesma solicitação durante novas tentativas do navegador. Pessoas com o mesmo e-mail podem enviar mensagens diferentes.

O formulário só confirma recebimento após salvar no banco, junto dos três trabalhos de entrega. Falhas nos destinos não desfazem o contato. `contact_deliveries` registra status, tentativas e última falha. Entregas em processamento abandonadas tornam-se disponíveis após 10 minutos.

## Ordem de ativação (ainda necessária em produção)

1. No projeto Supabase já usado pelo Caldeira Growth, executar `supabase/migrations/20261115120000_contact_leads.sql` com acesso administrativo. A service-role REST não permite executar DDL. As tabelas têm RLS e acesso apenas por service_role; não ficam acessíveis ao navegador ou automaticamente no mini CRM.
2. Criar um widget Cloudflare Turnstile para `caldeiragrowth.com` e `www.caldeiragrowth.com`. Configurar a chave pública e o segredo conforme abaixo. Nunca usar chaves de teste em produção.
3. No Apps Script existente, atualizar o código a partir de `google-apps-script.js`, preservando as propriedades existentes. Adicionar `CONTACT_RELAY_TOKEN` (segredo aleatório) e `CONTACT_NOTIFICATION_EMAIL` (`deniscaldeira@caldeiragrowth.com,deniscaldeiradealmeida@gmail.com`). Publicar nova versão da implantação existente. As ações CGI, artigos e mídia são preservadas; POSTs de contato antigos sem autenticação são rejeitados.
4. Na Vercel, configurar todas as variáveis abaixo, reutilizando o mesmo segredo do relay. A URL do Apps Script fica em `CONTACT_FORM_URL`, apenas no servidor. O frontend não depende mais de `VITE_CONTACT_FORM_URL`.
5. Para o CoS, configurar o mesmo bot e chat Telegram do Chief of Staff existente. Alternativamente, usar webhook autenticado compatível com o contrato abaixo. Não apontar para o endpoint genérico de execução do GestorGmail: ele não implementa esse contrato.
6. Fazer deploy somente depois da migração e da configuração. Validar o fluxo completo com um contato de teste identificado, conferindo banco, planilha, e-mail e Telegram. Não há migração automática dos registros históricos da planilha.

## Variáveis

| Local | Nome | Uso |
|---|---|---|
| Vercel, pública | `VITE_CONTACT_TURNSTILE_SITE_KEY` | Widget Turnstile |
| Vercel, segredo | `CONTACT_TURNSTILE_SECRET` | Siteverify |
| Vercel, segredo | `CONTACT_RATE_SECRET` | Segredo aleatório estável para HMAC dos limites |
| Vercel, servidor | `SUPABASE_URL` | Projeto existente |
| Vercel, segredo | `SUPABASE_SERVICE_ROLE_KEY` | Gravação restrita ao servidor |
| Vercel, servidor | `CONTACT_FORM_URL` | URL `/exec` do Apps Script |
| Vercel + Apps Script | `CONTACT_RELAY_TOKEN` | Segredo compartilhado, independente dos tokens CGI/conteúdo |
| Apps Script | `CONTACT_NOTIFICATION_EMAIL` | Destinatário controlado no servidor |
| Vercel, segredo | `CONTACT_COS_TELEGRAM_BOT_TOKEN` | Mesmo bot do CoS |
| Vercel, servidor | `CONTACT_COS_TELEGRAM_CHAT_ID` | Mesmo chat do CoS |
| Vercel, segredo | `CRON_SECRET` | Autenticação do reprocessamento |

Alternativa ao Telegram: `CONTACT_COS_WEBHOOK_URL` (HTTPS) e `CONTACT_COS_WEBHOOK_TOKEN` (Bearer). Se ambos os transportes estiverem configurados, Telegram tem preferência. O aviso Telegram é curto e inclui tema e referência, sem nome, e-mail ou mensagem do interessado. Os detalhes ficam no e-mail e no banco.

## Reprocessamento e garantias

O envio inicial é imediato. `/api/contact/delivery-sweep` reprocessa até 30 entregas; exige GET com `Authorization: Bearer <CRON_SECRET>`. O cron incluído roda diariamente às 12:30 UTC para manter compatibilidade com cron diário; a recuperação automática pode, portanto, demorar até o próximo dia. Em plano compatível, aumentar a frequência para cada 15 minutos. Pode-se acionar o endpoint autenticado manualmente.

As entregas usam concessão temporária e `FOR UPDATE SKIP LOCKED` para evitar dois workers no mesmo trabalho. O Apps Script registra event_id em `ContactDeliveryReceipts` e serializa operações. Webhooks devem deduplicar `Idempotency-Key`. A entrega é pelo menos uma vez: se o processo cair entre enviar o e-mail/Telegram ou gravar a linha e registrar o comprovante, pode haver duplicação. Telegram não possui chave de idempotência para sendMessage; o ID do lead permite reconhecer repetição.

## Controle

- `contact_submissions`: dados, origem, status comercial, classificação e notas. Cada solicitação tem seu próprio registro; o índice de e-mail permite reunir o histórico.
- `contact_deliveries`: entregas pendentes, em processamento ou enviadas.
- `contact_rate_limits`: contadores HMAC com limpeza de entradas antigas nas próximas submissões.
- A classificação inicial `valido` indica aprovação das verificações técnicas, não qualificação comercial. Suspeitos e spam podem ser marcados manualmente; não há classificador de conteúdo por IA.
- Não excluir registros antigos da planilha sem revisão. Não conceder SELECT público a essas tabelas.

## Desenvolvimento e testes

Usar `npm run dev:vercel` para executar a API localmente. `npm run dev` não encaminha mais contatos diretamente ao Apps Script, para não contornar a proteção. Para teste ponta a ponta em preview, adicionar explicitamente o hostname de preview à allowlist do servidor e configurar um widget apropriado; os hostnames de produção são os únicos permitidos por padrão.

Executar `npx vitest run tests/api/contact.test.ts tests/api/contact-delivery.test.ts tests/api/contact-apps-script.test.ts`, `npm run build` e lint dos arquivos alterados. A ativação remota e o teste real de entrega são passos separados dos testes locais.

Destinatários autorizados: `deniscaldeira@caldeiragrowth.com` e `deniscaldeiradealmeida@gmail.com`. O relé usa ambos como padrão; a propriedade do Apps Script permite configuração explícita.

## Estado da ativação em 15/11/2026

- Migração executada pelo SQL Editor do projeto `vppbphjrrrrpokqycwwa` (`caldeira-cgi`), com transação concluída.
- Verificado no banco: `contact_submissions`, `contact_deliveries` e `contact_rate_limits` com RLS ativo e SELECT de `anon` negado.
- A consulta aplicada não foi registrada automaticamente na tabela de histórico de migrations do CLI. Não reaplicar o arquivo sobre as tabelas existentes.
- Destinatários adicionados ao código local. Apps Script publicado ainda não foi atualizado.
- Painel Vercel autenticado no navegador; variáveis Supabase e CRON_SECRET já existem. Integração Vercel retorna 403 ao listar variáveis e CLI não autentica/conecta, mas o painel está disponível.
- Editor do Apps Script associado à planilha aberto: projeto `1dfmIaggSXVusjdWJvjHK2j19EUDejGeYIYPrE-2RE7Wg4nUFsgif_9fO`. Não substituir o código remoto sem verificar diferenças em relação ao arquivo local.
- Cloudflare requer login do proprietário em `https://dash.cloudflare.com/login`. Turnstile não criado e site ainda não publicado com estas alterações.

### Atualização após cadastro do Turnstile

- Confirmados no painel Vercel: `VITE_CONTACT_TURNSTILE_SITE_KEY` como Config em Production/Preview; `CONTACT_TURNSTILE_SECRET` como Secret em ambos.
- Criados no painel: `CONTACT_RATE_SECRET`, `CONTACT_RELAY_TOKEN` e `CONTACT_FORM_URL` em Production. Valores secretos não ficam no código.
- A URL `AKfycbwnGglZIsUiPnNeJN8jUxIrXdjZhHFKVE0TUQtLP1hGCv55pvdzJRUifsaFRbQIgXcr` usada pelo site NÃO pertence às seis implantações do projeto pessoal vinculado à planilha. Não houve publicação desse projeto pessoal.
- O rascunho do código pessoal foi restaurado; três propriedades preparatórias permanecem nele (`CONTACT_RELAY_TOKEN`, `CONTACT_NOTIFICATION_EMAIL`, `CONTACT_LEGACY_ENABLED=true`), sem mudança de implantação. Esses valores não substituem a configuração do relé corporativo.
- A sessão `deniscaldeira@caldeiragrowth.com` aparece expirada no Chrome. A observação da tela accounts.google.com foi recusada pelo controle do navegador. É necessário login pelo proprietário antes de localizar e atualizar a implantação corporativa.
- Backend/alertas ainda não publicados. CoS ainda precisa das duas variáveis do bot, já disponíveis no projeto GestorGmail local; não revelar os valores em mensagens ou logs.
- A cópia local original estava em uma branch antiga. Contato preserva agora o preenchimento por `?tema=` do main remoto, e vercel.json preserva as rotas e headers mais recentes. Para publicar, criar commit sobre main `0b75c1b454c08c8103340e7c2ae86dc5d550380a`, aplicando apenas arquivos deste trabalho. Não publicar toda a branch local antiga.

### Código corporativo confirmado pelo usuário

Denis forneceu integralmente o código v5 da conta corporativa. `google-apps-script.js` foi preparado sobre essa versão, preservando `ENABLE_CGI_INTERNAL_NOTIFICATION=true`, os outros dois kill switches desligados, artigos, mídia e os dados CGI.

A versão `2026-11-15-contact-v1` é transitória: aceita o formulário antigo enquanto `CONTACT_LEGACY_DISABLED` não for `true`. A proteção só estará completa após migrar todos os consumidores de `/api/contact`, testar o fluxo novo e definir `CONTACT_LEGACY_DISABLED=true` nas propriedades do Apps Script de produção. Não confundir esse nome com a propriedade preparatória do projeto pessoal (`CONTACT_LEGACY_ENABLED`), que não é utilizada nesta versão.

Enquanto a propriedade de bloqueio não for ativada, a entrada antiga continua sujeita a spam. Isso evita indisponibilidade durante a troca; não representa ativação da proteção.
