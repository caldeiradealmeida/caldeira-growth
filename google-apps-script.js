/**
 * Web App: recebe POST JSON do site Caldeira Growth e grava uma linha na planilha.
 * Colunas: timestamp, nome, email, empresa, cargo, tema, mensagem
 */
var SPREADSHEET_ID = '1NivGOjutCgJTGDjXxt8ydFiCeWrKvbbIdqmkVmwSC9M';
var SCRIPT_VERSION = '2026-07-16-cgi-v3';
var ARTICLES_SHEET_NAME = 'Artigos';
var MEDIA_SHEET_NAME = 'Midia';
var CGI_SHEET_NAME = 'CGI';
var ARTICLES_HEADERS = ['status', 'date', 'slug', 'title_pt', 'title_en', 'excerpt_pt', 'excerpt_en', 'content_pt', 'content_en', 'cover_url', 'source_name', 'source_url'];
var MEDIA_HEADERS = ['status', 'date', 'title_pt', 'title_en', 'outlet', 'url', 'cover_url', 'featured'];
var CGI_HEADERS = [
  'timestamp',
  'nome',
  'email',
  'telefone',
  'empresa',
  'cargo',
  'setor',
  'funcionarios',
  'faturamento_anual',
  'desafio_atual',
  'meta_crescimento_12m',
  'intencao_investimento',
  'cgi_final',
  'nivel',
  'estrategia',
  'mercado_cliente',
  'maquina_crescimento',
  'execucao_gestao',
  'lideranca_cultura',
  'pontos_atencao',
  'diagnostico_deterministico',
  'ai_status',
  'ai_report',
  'ai_report_text',
  'respostas_json',
  'user_agent',
  'referrer',
  'site_empresa',
  'enrichment_status',
  'enrichment_url_final',
  'enrichment_title',
  'enrichment_description',
  'enrichment_headings',
  'enrichment_text',
  'enrichment_error',
  'email_domain',
  'email_domain_status',
  'email_domain_has_mx',
  'email_domain_has_address_fallback',
  'email_domain_error',
  'comentarios',
  'ip',
  'pais',
  'regiao',
  'cidade',
  'latitude',
  'longitude',
  'timezone',
  'idioma'
];

function doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || '').trim();
    if (action === 'articles_csv') {
      return csvResponse_(getSheetCsv_(ARTICLES_SHEET_NAME, ARTICLES_HEADERS));
    }
    if (action === 'media_csv') {
      return csvResponse_(getSheetCsv_(MEDIA_SHEET_NAME, MEDIA_HEADERS));
    }
    return jsonResponse_({ ok: true, version: SCRIPT_VERSION });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    if (
      (!e || !e.postData || !e.postData.contents) &&
      (!e || !e.parameter || Object.keys(e.parameter).length === 0)
    ) {
      return jsonResponse_({ ok: false, error: 'empty_body' });
    }

    var payload = parsePayload_(e);
    var action = String(payload.action || payload.type || '').trim().toLowerCase();

    if (action === 'article') {
      return handleArticlePost_(payload);
    }
    if (action === 'media') {
      return handleMediaPost_(payload);
    }
    if (action === 'cgi_assessment') {
      return handleCgiAssessmentPost_(payload);
    }

    var nome = String(payload.nome || '').trim();
    var email = String(payload.email || '').trim();
    if (!nome || !email) {
      return jsonResponse_({ ok: false, error: 'validation' });
    }

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    var timestamp = new Date();
    var empresa = String(payload.empresa || '').trim();
    var cargo = String(payload.cargo || '').trim();
    var tema = String(payload.tema || '').trim();
    var mensagem = String(payload.mensagem || '').trim();

    sheet.appendRow([timestamp, nome, email, empresa, cargo, tema, mensagem]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return (e && e.parameter) || {};
    }
  }
  return (e && e.parameter) || {};
}

function handleArticlePost_(payload) {
  var sheet = getOrCreateSheet_(ARTICLES_SHEET_NAME, ARTICLES_HEADERS);
  var token = String(payload.token || '').trim();
  var expected = String(PropertiesService.getScriptProperties().getProperty('CONTENT_POST_TOKEN') || '').trim();
  if (!expected || token !== expected) {
    return jsonResponse_({ ok: false, error: 'auth' });
  }

  var titlePt = String(payload.title_pt || '').trim();
  var contentPt = String(payload.content_pt || '').trim();
  if (!titlePt || !contentPt) {
    return jsonResponse_({ ok: false, error: 'validation' });
  }

  var slug = String(payload.slug || slugify_(titlePt)).trim();
  var date = String(payload.date || new Date().toISOString().slice(0, 10)).trim();
  var row = [
    String(payload.status || 'published').trim(),
    date,
    slug,
    titlePt,
    String(payload.title_en || '').trim(),
    String(payload.excerpt_pt || '').trim(),
    String(payload.excerpt_en || '').trim(),
    contentPt,
    String(payload.content_en || '').trim(),
    String(payload.cover_url || '').trim(),
    String(payload.source_name || '').trim(),
    String(payload.source_url || '').trim(),
  ];

  sheet.appendRow(row);
  return jsonResponse_({ ok: true, type: 'article', slug: slug });
}

function handleMediaPost_(payload) {
  var sheet = getOrCreateSheet_(MEDIA_SHEET_NAME, MEDIA_HEADERS);
  var token = String(payload.token || '').trim();
  var expected = String(PropertiesService.getScriptProperties().getProperty('CONTENT_POST_TOKEN') || '').trim();
  if (!expected || token !== expected) {
    return jsonResponse_({ ok: false, error: 'auth' });
  }

  var titlePt = String(payload.title_pt || '').trim();
  var outlet = String(payload.outlet || '').trim();
  var url = String(payload.url || '').trim();
  if (!titlePt || !outlet || !url) {
    return jsonResponse_({ ok: false, error: 'validation' });
  }

  var date = String(payload.date || new Date().toISOString().slice(0, 10)).trim();
  var row = [
    String(payload.status || 'published').trim(),
    date,
    titlePt,
    String(payload.title_en || '').trim(),
    outlet,
    url,
    String(payload.cover_url || '').trim(),
    String(payload.featured || '').trim(),
  ];

  sheet.appendRow(row);
  return jsonResponse_({ ok: true, type: 'media', url: url });
}

function handleCgiAssessmentPost_(payload) {
  var lead = payload.lead || {};
  var score = payload.score || {};
  var answers = payload.answers || {};
  var enrichment = payload.websiteEnrichment || {};
  var enrichmentHeadings = Array.isArray(enrichment.headings) ? enrichment.headings : [];
  var emailValidation = payload.emailValidation || {};
  var requestContext = payload.requestContext || {};
  var sheet = getOrCreateSheet_(CGI_SHEET_NAME, CGI_HEADERS);
  var timestamp = new Date();

  var nome = String(lead.name || '').trim();
  var email = String(lead.email || '').trim();
  if (!nome || !email) {
    return jsonResponse_({ ok: false, error: 'validation' });
  }

  var dimensionMap = {};
  var dimensionScores = score.dimensionScores || [];
  for (var i = 0; i < dimensionScores.length; i++) {
    dimensionMap[String(dimensionScores[i].dimensionId)] = dimensionScores[i].score;
  }

  var attentionPoints = (score.attentionPoints || [])
    .map(function (item) {
      return String(item.title || item.dimensionId || '') + ': ' + String(item.score || '');
    })
    .join(' | ');

  var row = [
    timestamp,
    nome,
    email,
    String(lead.phone || '').trim(),
    String(lead.company || '').trim(),
    String(lead.role || '').trim(),
    String(lead.sector || '').trim(),
    String(lead.employeeCount || '').trim(),
    String(lead.annualRevenue || '').trim(),
    String(lead.currentChallenge || '').trim(),
    String(lead.growthGoal || '').trim(),
    String(lead.investmentIntent || '').trim(),
    score.finalScore || '',
    score.level ? String(score.level.title || '').trim() : '',
    dimensionMap.strategy || '',
    dimensionMap.market || '',
    dimensionMap.growthMachine || '',
    dimensionMap.execution || '',
    dimensionMap.leadership || '',
    attentionPoints,
    String(score.diagnostic || '').trim(),
    String(payload.aiStatus || '').trim(),
    String(payload.aiReport || '').trim(),
    String(payload.aiReportText || '').trim(),
    JSON.stringify(answers),
    String(payload.userAgent || '').trim(),
    String(payload.referrer || '').trim(),
    String(lead.companyWebsite || '').trim(),
    String(enrichment.status || '').trim(),
    String(enrichment.finalUrl || '').trim(),
    String(enrichment.title || '').trim(),
    String(enrichment.description || '').trim(),
    enrichmentHeadings.join(' | '),
    String(enrichment.observedText || '').trim(),
    String(enrichment.error || '').trim(),
    String(emailValidation.domain || '').trim(),
    String(emailValidation.status || '').trim(),
    String(emailValidation.hasMx || '').trim(),
    String(emailValidation.hasAddressFallback || '').trim(),
    String(emailValidation.error || '').trim(),
    String(lead.comments || '').trim(),
    String(requestContext.ip || '').trim(),
    String(requestContext.country || '').trim(),
    String(requestContext.region || '').trim(),
    String(requestContext.city || '').trim(),
    String(requestContext.latitude || '').trim(),
    String(requestContext.longitude || '').trim(),
    String(requestContext.timezone || '').trim(),
    String(payload.language || '').trim()
  ];

  sheet.appendRow(row);
  sendCgiNotification_(lead, score, attentionPoints, payload);
  sendCgiLeadReport_(lead, score, attentionPoints, payload);

  return jsonResponse_({ ok: true, type: 'cgi_assessment', version: SCRIPT_VERSION });
}

function sendCgiNotification_(lead, score, attentionPoints, payload) {
  try {
    var configuredEmail = String(PropertiesService.getScriptProperties().getProperty('CGI_NOTIFICATION_EMAIL') || '').trim();
    var recipient = configuredEmail || 'contato@caldeiragrowth.com';
    var subject = '[CGI] Novo assessment - ' + String(lead.company || lead.name || '');
    var dimensionLines = (score.dimensionScores || [])
      .map(function (item) {
        return '- ' + String(item.title || item.dimensionId || '') + ': ' + String(item.score || '');
      })
      .join('\n');
    var body = [
      'Novo CGI - Caldeira Growth Index',
      '',
      'Lead:',
      'Nome: ' + String(lead.name || ''),
      'Email: ' + String(lead.email || ''),
      'Telefone: ' + String(lead.phone || ''),
      'Empresa: ' + String(lead.company || ''),
      'Site da empresa: ' + String(lead.companyWebsite || ''),
      'Cargo: ' + String(lead.role || ''),
      'Setor: ' + String(lead.sector || ''),
      'Funcionarios: ' + String(lead.employeeCount || ''),
      'Faturamento: ' + String(lead.annualRevenue || ''),
      'Desafio: ' + String(lead.currentChallenge || ''),
      'Meta 12m: ' + String(lead.growthGoal || ''),
      'Intencao de investimento: ' + String(lead.investmentIntent || ''),
      'Comentarios adicionais: ' + String(lead.comments || ''),
      'Localizacao aproximada: ' + [
        String((payload.requestContext && payload.requestContext.city) || ''),
        String((payload.requestContext && payload.requestContext.region) || ''),
        String((payload.requestContext && payload.requestContext.country) || '')
      ].filter(Boolean).join(', '),
      '',
      'Resultado:',
      'CGI final: ' + String(score.finalScore || ''),
      'Nivel: ' + String(score.level && score.level.title ? score.level.title : ''),
      '',
      'Scores por dimensão:',
      dimensionLines,
      '',
      'Pontos de atenção:',
      attentionPoints,
      '',
      'Diagnostico:',
      String(score.diagnostic || ''),
      '',
      'AI status: ' + String(payload.aiStatus || ''),
      'Enriquecimento site: ' + String((payload.websiteEnrichment && payload.websiteEnrichment.status) || ''),
      'URL final enriquecida: ' + String((payload.websiteEnrichment && payload.websiteEnrichment.finalUrl) || ''),
      payload.aiReportText ? '\nRelatório com IA:\n' + String(payload.aiReportText || '') : ''
    ].join('\n');

    MailApp.sendEmail(recipient, subject, body);
  } catch (err) {
    console.error('Erro ao enviar notificacao CGI: ' + String(err));
  }
}

function sendCgiLeadReport_(lead, score, attentionPoints, payload) {
  try {
    var email = String(lead.email || '').trim();
    if (!email) return;

    var dimensionLines = (score.dimensionScores || [])
      .map(function (item) {
        return '- ' + String(item.title || item.dimensionId || '') + ': ' + String(item.score || '') + '/100';
      })
      .join('\n');

    var aiReport = String(payload.aiReportText || payload.aiReport || '').trim();
    var body = [
      'Olá, ' + String(lead.name || '').trim() + '.',
      '',
      'Segue o seu resultado do CGI - Caldeira Growth Index.',
      '',
      'CGI final: ' + String(score.finalScore || ''),
      'Nível: ' + String(score.level && score.level.title ? score.level.title : ''),
      '',
      'Diagnóstico:',
      aiReport || String(score.diagnostic || ''),
      '',
      'Score por dimensão:',
      dimensionLines,
      '',
      '3 principais pontos de atenção:',
      attentionPoints,
      '',
      'Para aprofundar o diagnóstico, o próximo passo recomendado é agendar uma conversa estratégica com a Caldeira Growth.',
      '',
      'Caldeira Growth'
    ].join('\n');

    MailApp.sendEmail(email, 'Seu CGI - Caldeira Growth Index', body);
  } catch (err) {
    console.error('Erro ao enviar relatório CGI ao lead: ' + String(err));
  }
}

function getOrCreateSheet_(name, headers) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#111827');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  ensureHeaders_(sheet, headers);

  return sheet;
}

function ensureHeaders_(sheet, headers) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return;

  var currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || '').trim();
  });
  var missing = headers.filter(function (header) {
    return currentHeaders.indexOf(header) === -1;
  });
  if (missing.length === 0) return;

  sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  var headerRange = sheet.getRange(1, 1, 1, lastColumn + missing.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#111827');
  headerRange.setFontColor('#ffffff');
}

function getSheetCsv_(name, headers) {
  var sheet = getOrCreateSheet_(name, headers);
  var values = sheet.getDataRange().getDisplayValues();
  return values.map(function (row) {
    return row.map(csvEscape_).join(',');
  }).join('\n');
}

function csvEscape_(value) {
  var text = String(value == null ? '' : value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function csvResponse_(csv) {
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

function slugify_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
