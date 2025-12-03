/**
 * Google Apps Script para Tracking de QR Code e Formulário de Cadastro
 * 
 * INSTRUÇÕES:
 * 1. Abra seu Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código completo
 * 4. Salve o projeto
 * 5. Vá em Publicar > Implantar como aplicativo da web
 * 6. Execute como: Eu mesmo
 * 7. Quem tem acesso: Qualquer pessoa, mesmo anônimo
 * 8. Copie a URL gerada e atualize no código React se necessário
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Detecta se é um registro de tracking (QR code) ou formulário normal
    const isTracking = e.parameter.source === 'qr_code_campaign' || 
                       (e.parameter.source && !e.parameter.nome);
    
    if (isTracking) {
      // ===== TRACKING DE QR CODE =====
      let trackingSheet = sheet.getSheetByName('QR_Tracking');
      
      // Cria a aba se não existir
      if (!trackingSheet) {
        trackingSheet = sheet.insertSheet('QR_Tracking');
        trackingSheet.appendRow(['timestamp', 'source', 'user_agent', 'referrer', 'url']);
        // Formata cabeçalho
        const headerRange = trackingSheet.getRange(1, 1, 1, 5);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4285f4');
        headerRange.setFontColor('#ffffff');
      }
      
      // Verifica se já tem cabeçalho
      if (trackingSheet.getLastRow() === 0) {
        trackingSheet.appendRow(['timestamp', 'source', 'user_agent', 'referrer', 'url']);
        const headerRange = trackingSheet.getRange(1, 1, 1, 5);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4285f4');
        headerRange.setFontColor('#ffffff');
      }
      
      // Coleta os dados
      const timestamp = e.parameter.timestamp || new Date().toISOString();
      const source = e.parameter.source || 'qr_code_campaign';
      const userAgent = e.parameter.user_agent || '';
      const referrer = e.parameter.referrer || 'direct';
      const url = e.parameter.url || '';
      
      // Adiciona a linha
      trackingSheet.appendRow([timestamp, source, userAgent, referrer, url]);
      
      // Formata a última linha adicionada (opcional - deixa mais legível)
      const lastRow = trackingSheet.getLastRow();
      trackingSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Tracking registrado com sucesso',
        row: lastRow
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      // ===== FORMULÁRIO DE CADASTRO =====
      let formSheet = sheet.getSheetByName('Cadastros');
      
      // Cria a aba se não existir
      if (!formSheet) {
        formSheet = sheet.insertSheet('Cadastros');
        formSheet.appendRow(['timestamp', 'nome', 'email', 'celular', 'empresa']);
        // Formata cabeçalho
        const headerRange = formSheet.getRange(1, 1, 1, 5);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#34a853');
        headerRange.setFontColor('#ffffff');
      }
      
      // Verifica se já tem cabeçalho
      if (formSheet.getLastRow() === 0) {
        formSheet.appendRow(['timestamp', 'nome', 'email', 'celular', 'empresa']);
        const headerRange = formSheet.getRange(1, 1, 1, 5);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#34a853');
        headerRange.setFontColor('#ffffff');
      }
      
      // Coleta os dados do formulário
      const timestamp = new Date().toISOString();
      const nome = e.parameter.nome || '';
      const email = e.parameter.email || '';
      const celular = e.parameter.celular || '';
      const empresa = e.parameter.empresa || '';
      
      // Validação básica
      if (!nome || !email || !celular || !empresa) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Todos os campos são obrigatórios'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Adiciona a linha
      formSheet.appendRow([timestamp, nome, email, celular, empresa]);
      
      // Formata a última linha adicionada
      const lastRow = formSheet.getLastRow();
      formSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Cadastro realizado com sucesso',
        row: lastRow
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    // Log do erro (útil para debug)
    Logger.log('Erro: ' + error.toString());
    Logger.log('Parâmetros recebidos: ' + JSON.stringify(e.parameter));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função auxiliar para testar o script
 * Execute esta função no editor do Apps Script para testar
 */
function testTracking() {
  const mockEvent = {
    parameter: {
      source: 'qr_code_campaign',
      timestamp: new Date().toISOString(),
      user_agent: 'Mozilla/5.0 (Test)',
      referrer: 'direct',
      url: 'https://seudominio.com/qr'
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

function testForm() {
  const mockEvent = {
    parameter: {
      nome: 'Teste',
      email: 'teste@example.com',
      celular: '(11) 99999-9999',
      empresa: 'Empresa Teste'
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

