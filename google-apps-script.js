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

const ARTICLES_SHEET_NAME = 'Artigos';
const ARTICLES_HEADERS = [
  'status',
  'date',
  'slug',
  'title_pt',
  'title_en',
  'excerpt_pt',
  'excerpt_en',
  'content_pt',
  'content_en',
  'cover_url',
  'source_name',
  'source_url',
];
const MEDIA_SHEET_NAME = 'Midia';
const MEDIA_HEADERS = [
  'status',
  'date',
  'title_pt',
  'title_en',
  'outlet',
  'url',
  'cover_url',
  'featured',
];

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'articles_csv') {
      return csvResponse(getSheetCsv(spreadsheet, ARTICLES_SHEET_NAME, ARTICLES_HEADERS));
    }

    if (action === 'media_csv') {
      return csvResponse(getSheetCsv(spreadsheet, MEDIA_SHEET_NAME, MEDIA_HEADERS));
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      service: 'caldeira-growth-content'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const payload = parsePayload(e);

    if (payload.action === 'article' || payload.type === 'article') {
      return handleArticlePost(sheet, payload);
    }

    if (payload.action === 'media' || payload.type === 'media') {
      return handleMediaPost(sheet, payload);
    }
    
    // Lê os parâmetros (funciona tanto com FormData quanto com query string)
    const source = payload.source || '';
    const nome = payload.nome || '';
    const email = payload.email || '';
    const celular = payload.celular || '';
    const empresa = payload.empresa || '';
    
    // Detecta se é um registro de tracking (QR code) ou formulário normal
    // Tracking: tem source='qr_code_campaign' OU não tem campos do formulário (nome, email, etc)
    // Formulário: tem pelo menos nome e email
    const isTracking = source === 'qr_code_campaign' || 
                       (!nome && !email && !celular && !empresa);
    
    // Log para debug (pode remover depois)
    Logger.log('Detecção - source: ' + source + ', isTracking: ' + isTracking);
    
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
      const timestamp = payload.timestamp || new Date().toISOString();
      const source = payload.source || 'qr_code_campaign';
      const userAgent = payload.user_agent || '';
      const referrer = payload.referrer || 'direct';
      const url = payload.url || '';
      
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
      const nome = payload.nome || '';
      const email = payload.email || '';
      const celular = payload.celular || '';
      const empresa = payload.empresa || '';
      
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
    Logger.log('Parâmetros recebidos: ' + JSON.stringify(e.parameter || {}));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function parsePayload(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      Logger.log('Payload não-JSON, usando parâmetros: ' + error.toString());
    }
  }

  return (e && e.parameter) || {};
}

function handleArticlePost(spreadsheet, payload) {
  validateContentToken(payload.token);

  const row = buildArticleRow(payload);
  let articlesSheet = spreadsheet.getSheetByName(ARTICLES_SHEET_NAME);

  if (!articlesSheet) {
    articlesSheet = spreadsheet.insertSheet(ARTICLES_SHEET_NAME);
  }

  ensureArticlesHeaders(articlesSheet);
  articlesSheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Artigo registrado com sucesso',
    slug: row[2],
    row: articlesSheet.getLastRow()
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleMediaPost(spreadsheet, payload) {
  validateContentToken(payload.token);

  const row = buildMediaRow(payload);
  let mediaSheet = spreadsheet.getSheetByName(MEDIA_SHEET_NAME);

  if (!mediaSheet) {
    mediaSheet = spreadsheet.insertSheet(MEDIA_SHEET_NAME);
  }

  ensureHeaders(mediaSheet, MEDIA_HEADERS);
  mediaSheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Mídia registrada com sucesso',
    url: row[5],
    row: mediaSheet.getLastRow()
  })).setMimeType(ContentService.MimeType.JSON);
}

function validateContentToken(token) {
  const expected =
    PropertiesService.getScriptProperties().getProperty('CONTENT_POST_TOKEN') ||
    PropertiesService.getScriptProperties().getProperty('ARTICLES_POST_TOKEN');
  if (!expected) {
    throw new Error('CONTENT_POST_TOKEN não configurado nas propriedades do script.');
  }

  if (!token || token !== expected) {
    throw new Error('Token inválido para publicar conteúdo.');
  }
}

function buildArticleRow(payload) {
  const titlePt = String(payload.title_pt || '').trim();
  const contentPt = String(payload.content_pt || '').trim();
  const slug = String(payload.slug || slugify(titlePt)).trim();

  if (!titlePt) {
    throw new Error('title_pt é obrigatório.');
  }

  if (!contentPt) {
    throw new Error('content_pt é obrigatório.');
  }

  if (!slug) {
    throw new Error('slug é obrigatório.');
  }

  return ARTICLES_HEADERS.map((header) => {
    if (header === 'status') return String(payload.status || 'published');
    if (header === 'date') return String(payload.date || new Date().toISOString().slice(0, 10));
    if (header === 'slug') return slug;
    return String(payload[header] || '');
  });
}

function ensureArticlesHeaders(articlesSheet) {
  ensureHeaders(articlesSheet, ARTICLES_HEADERS);
}

function ensureHeaders(sheet, headers) {
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some((value) => String(value || '').trim());

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#111827')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function buildMediaRow(payload) {
  const titlePt = String(payload.title_pt || payload.title || '').trim();
  const outlet = String(payload.outlet || payload.source_name || '').trim();
  const url = String(payload.url || payload.source_url || '').trim();

  if (!titlePt) {
    throw new Error('title_pt é obrigatório.');
  }

  if (!outlet) {
    throw new Error('outlet é obrigatório.');
  }

  if (!url) {
    throw new Error('url é obrigatório.');
  }

  return MEDIA_HEADERS.map((header) => {
    if (header === 'status') return String(payload.status || 'published');
    if (header === 'date') return String(payload.date || new Date().toISOString().slice(0, 10));
    if (header === 'title_pt') return titlePt;
    if (header === 'title_en') return String(payload.title_en || titlePt);
    if (header === 'outlet') return outlet;
    if (header === 'url') return url;
    if (header === 'featured') return String(payload.featured || '');
    return String(payload[header] || '');
  });
}

function getSheetCsv(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  ensureHeaders(sheet, headers);

  const values = sheet.getDataRange().getDisplayValues();
  return values.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function csvResponse(csv) {
  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
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
