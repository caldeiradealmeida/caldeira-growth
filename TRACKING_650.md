# Como medir acessos e cliques na página /650

## Eventos implementados no código

A página `/650` envia estes eventos para o **dataLayer** (Google Tag Manager):

| Evento | Quando dispara | Parâmetros |
|--------|----------------|------------|
| `page_view_650` | Ao carregar a página /650 | `page_path`, `page_title` |
| `click_amazon_650` | Ao clicar em "Comprar na Amazon" ou "Comprar agora na Amazon" | `button_location` (hero ou cta_final), `page_path` |

---

## Configuração no Google Tag Manager

### 1. Acessos à página (page_view_650)

1. Acesse [tagmanager.google.com](https://tagmanager.google.com) e abra o container **GTM-NRJ366QC**
2. **Triggers** → Novo → **Custom Event**
   - Nome: `Page View 650`
   - Event name: `page_view_650`
3. **Tags** → Nova → **Google Analytics: Evento GA4**
   - Nome: `GA4 - Page View 650`
   - Event name: `page_view_650`
   - Event parameters: `page_path` = `{{dlv - page_path}}` (crie a variável se necessário)
   - Trigger: `Page View 650`
4. **Variáveis** → Nova → **Data Layer Variable**
   - Nome: `dlv - page_path`
   - Data Layer Variable Name: `page_path`

### 2. Cliques nos botões Amazon (click_amazon_650)

1. **Triggers** → Novo → **Custom Event**
   - Nome: `Click Amazon 650`
   - Event name: `click_amazon_650`
2. **Tags** → Nova → **Google Analytics: Evento GA4**
   - Nome: `GA4 - Click Amazon 650`
   - Event name: `click_amazon_650`
   - Event parameters:
     - `button_location` = `{{dlv - button_location}}`
     - `page_path` = `{{dlv - page_path}}`
   - Trigger: `Click Amazon 650`
3. **Variáveis** → Crie:
   - `dlv - button_location` (Data Layer Variable Name: `button_location`)
   - `dlv - page_path` (Data Layer Variable Name: `page_path`)

### 3. Publicar

Depois de criar as tags e triggers, clique em **Enviar** para publicar as alterações.

---

## Onde ver as métricas

### Google Analytics 4

- **Relatórios** → **Engajamento** → **Eventos**
- Procure por: `page_view_650` (acessos) e `click_amazon_650` (cliques)

### Relatório personalizado (sugestão)

Crie um relatório de exploração com:
- Dimensão: `Nome do evento` (filtrar por `page_view_650` e `click_amazon_650`)
- Métrica: `Contagem de eventos`
- Para cliques: adicione `button_location` como dimensão secundária

---

## UTM na Amazon

O link da Amazon usa UTM:

```
?utm_source=landing650&utm_campaign=desafio650
```

Se você tiver Google Analytics configurado na página de destino da Amazon (ou em campanhas de anúncios), poderá filtrar tráfego por `utm_source=landing650`.

---

## Meta Pixel

O script existente já dispara `click_amazon` para todos os cliques em botões Amazon. Para diferenciar cliques da página /650 no Meta Ads:

1. No GTM, crie uma tag **Meta Pixel - Custom Event** que dispare no evento `click_amazon_650`
2. Ou use o parâmetro `page_path` no evento para filtrar no relatório de eventos do Meta
