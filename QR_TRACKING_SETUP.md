# Configuração de Tracking para QR Code

## O que foi implementado

Foi criada uma página de redirecionamento (`/qr` ou `/amazon`) que:
1. Registra o acesso no Google Sheets
2. Mostra um countdown de 2 segundos
3. Redireciona automaticamente para a Amazon

## Como adaptar o Google Apps Script

Você precisa adaptar seu Google Apps Script para receber e salvar os dados de tracking. Aqui está um exemplo de código:

### 1. Criar uma nova aba no Google Sheets chamada "QR_Tracking"

Com as seguintes colunas na primeira linha:
- A1: timestamp
- B1: source
- C1: user_agent
- D1: referrer
- E1: url

### 2. Código do Google Apps Script

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Verifica se é um registro de tracking (QR code) ou formulário normal
    const source = e.parameter.source || e.parameter.nome ? 'form' : 'qr_tracking';
    
    if (source === 'qr_tracking' || e.parameter.source === 'qr_code_campaign') {
      // Salva na aba QR_Tracking
      const trackingSheet = sheet.getSheetByName('QR_Tracking') || sheet.insertSheet('QR_Tracking');
      
      // Define cabeçalhos se a aba estiver vazia
      if (trackingSheet.getLastRow() === 0) {
        trackingSheet.appendRow(['timestamp', 'source', 'user_agent', 'referrer', 'url']);
      }
      
      const timestamp = e.parameter.timestamp || new Date().toISOString();
      const sourceValue = e.parameter.source || 'qr_code_campaign';
      const userAgent = e.parameter.user_agent || '';
      const referrer = e.parameter.referrer || 'direct';
      const url = e.parameter.url || '';
      
      trackingSheet.appendRow([timestamp, sourceValue, userAgent, referrer, url]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Tracking registrado com sucesso'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Código existente para o formulário
      const formSheet = sheet.getSheetByName('Cadastros') || sheet.getActiveSheet();
      
      if (formSheet.getLastRow() === 0) {
        formSheet.appendRow(['timestamp', 'nome', 'email', 'celular', 'empresa']);
      }
      
      const timestamp = new Date().toISOString();
      const nome = e.parameter.nome || '';
      const email = e.parameter.email || '';
      const celular = e.parameter.celular || '';
      const empresa = e.parameter.empresa || '';
      
      formSheet.appendRow([timestamp, nome, email, celular, empresa]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Cadastro realizado com sucesso'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. Alternativa: Script separado para tracking

Se preferir manter scripts separados, você pode criar um novo Google Apps Script Web App apenas para tracking e atualizar a URL no arquivo `AmazonRedirect.tsx`.

## URLs disponíveis

- `/qr` - Redireciona para Amazon com tracking
- `/amazon` - Redireciona para Amazon com tracking (alternativa)

## Análise dos dados

Após configurar, você poderá analisar:
- Quantidade de acessos via QR code
- Horários de maior tráfego
- Navegadores/dispositivos mais usados
- Origem do tráfego (referrer)

## Nota importante

O tracking usa `mode: 'no-cors'` porque o Google Apps Script não retorna headers CORS apropriados. Isso significa que não podemos verificar se o registro foi bem-sucedido, mas os dados serão salvos mesmo assim.

