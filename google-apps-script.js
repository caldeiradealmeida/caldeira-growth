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
  'completed_at',
  'public_assessment_id',
  'anonymous_session_id',
  'completion_event_id',
  'status',
  'report_status',
  'secondary_sync_status',
  'nome',
  'email',
  'telefone',
  'empresa',
  'cargo',
  'setor',
  'modelo_comercial',
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
  'comentario_adicional',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'li_fat_id',
  'landing_page',
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
  var attribution = payload.attribution || {};
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

  var comments = String(lead.comments || '').trim();
  var row = {
    timestamp: timestamp,
    completed_at: timestamp.toISOString(),
    public_assessment_id: String(payload.publicAssessmentId || payload.public_assessment_id || '').trim(),
    anonymous_session_id: String(payload.anonymousSessionId || payload.anonymous_session_id || '').trim(),
    completion_event_id: String(payload.completionEventId || payload.completion_event_id || '').trim(),
    status: 'completed',
    report_status: String(payload.reportStatus || payload.report_status || '').trim(),
    secondary_sync_status: String(payload.secondarySyncStatus || payload.secondary_sync_status || '').trim(),
    nome: nome,
    email: email,
    telefone: String(lead.phone || '').trim(),
    empresa: String(lead.company || '').trim(),
    cargo: String(lead.role || '').trim(),
    setor: String(lead.sector || '').trim(),
    modelo_comercial: String(lead.commercialRelationshipModel || lead.commercial_relationship_model || '').trim(),
    funcionarios: String(lead.employeeCount || lead.employee_count || '').trim(),
    faturamento_anual: String(lead.annualRevenue || lead.annual_revenue_range || '').trim(),
    desafio_atual: String(lead.currentChallenge || lead.current_challenge || '').trim(),
    meta_crescimento_12m: String(lead.growthGoal || lead.growth_goal || '').trim(),
    intencao_investimento: String(lead.investmentIntent || lead.investment_intent || '').trim(),
    cgi_final: score.finalScore || '',
    nivel: score.level ? String(score.level.title || '').trim() : '',
    estrategia: dimensionMap.strategy || '',
    mercado_cliente: dimensionMap.market || '',
    maquina_crescimento: dimensionMap.growthMachine || '',
    execucao_gestao: dimensionMap.execution || '',
    lideranca_cultura: dimensionMap.leadership || '',
    pontos_atencao: attentionPoints,
    diagnostico_deterministico: String(score.diagnostic || '').trim(),
    ai_status: String(payload.aiStatus || '').trim(),
    ai_report: String(payload.aiReport || '').trim(),
    ai_report_text: String(payload.aiReportText || '').trim(),
    respostas_json: JSON.stringify(answers),
    user_agent: String(payload.userAgent || '').trim(),
    referrer: String(payload.referrer || '').trim(),
    site_empresa: String(lead.companyWebsite || lead.company_website || '').trim(),
    enrichment_status: String(enrichment.status || '').trim(),
    enrichment_url_final: String(enrichment.finalUrl || '').trim(),
    enrichment_title: String(enrichment.title || '').trim(),
    enrichment_description: String(enrichment.description || '').trim(),
    enrichment_headings: enrichmentHeadings.join(' | '),
    enrichment_text: String(enrichment.observedText || '').trim(),
    enrichment_error: String(enrichment.error || '').trim(),
    email_domain: String(emailValidation.domain || '').trim(),
    email_domain_status: String(emailValidation.status || '').trim(),
    email_domain_has_mx: String(emailValidation.hasMx || '').trim(),
    email_domain_has_address_fallback: String(emailValidation.hasAddressFallback || '').trim(),
    email_domain_error: String(emailValidation.error || '').trim(),
    comentarios: comments,
    comentario_adicional: comments,
    utm_source: String(attribution.utm_source || '').trim(),
    utm_medium: String(attribution.utm_medium || '').trim(),
    utm_campaign: String(attribution.utm_campaign || '').trim(),
    utm_content: String(attribution.utm_content || '').trim(),
    utm_term: String(attribution.utm_term || '').trim(),
    gclid: String(attribution.gclid || '').trim(),
    fbclid: String(attribution.fbclid || '').trim(),
    li_fat_id: String(attribution.li_fat_id || '').trim(),
    landing_page: String(attribution.landing_page || '').trim(),
    ip: String(requestContext.ip || '').trim(),
    pais: String(requestContext.country || '').trim(),
    regiao: String(requestContext.region || '').trim(),
    cidade: String(requestContext.city || '').trim(),
    latitude: String(requestContext.latitude || '').trim(),
    longitude: String(requestContext.longitude || '').trim(),
    timezone: String(requestContext.timezone || '').trim(),
    idioma: String(payload.language || '').trim()
  };

  appendMappedRow_(sheet, CGI_HEADERS, row);
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
    var language = String(payload.language || 'pt').trim();
    var allLabels = {
      pt: {
        greeting: 'Olá, ',
        intro: 'Segue o seu resultado do CGI - Caldeira Growth Index.',
        finalScore: 'CGI final',
        level: 'Nível',
        diagnosis: 'Diagnóstico',
        scoreByDimension: 'Score por dimensão',
        attentionPoints: '3 principais pontos de atenção',
        nextStep: 'Para aprofundar o diagnóstico, o próximo passo recomendado é solicitar uma conversa estratégica com a Caldeira Growth.',
        subject: 'Seu CGI - Caldeira Growth Index'
      },
      en: {
        greeting: 'Hello, ',
        intro: 'Here is your CGI - Caldeira Growth Index result.',
        finalScore: 'Final CGI',
        level: 'Level',
        diagnosis: 'Diagnosis',
        scoreByDimension: 'Score by dimension',
        attentionPoints: '3 main attention points',
        nextStep: 'To deepen the diagnosis, the recommended next step is to request a strategic conversation with Caldeira Growth.',
        subject: 'Your CGI - Caldeira Growth Index'
      },
      es: {
        greeting: 'Hola, ',
        intro: 'Este es su resultado del CGI - Caldeira Growth Index.',
        finalScore: 'CGI final',
        level: 'Nivel',
        diagnosis: 'Diagnóstico',
        scoreByDimension: 'Score por dimensión',
        attentionPoints: '3 principales puntos de atención',
        nextStep: 'Para profundizar el diagnóstico, el próximo paso recomendado es solicitar una conversación estratégica con Caldeira Growth.',
        subject: 'Su CGI - Caldeira Growth Index'
      }
    };
    var labels = allLabels[language] || allLabels.pt;

    var dimensionLines = (score.dimensionScores || [])
      .map(function (item) {
        return '- ' + String(item.title || item.dimensionId || '') + ': ' + String(item.score || '') + '/100';
      })
      .join('\n');

    var aiReport = String(payload.aiReportText || payload.aiReport || '').trim();
    var body = [
      labels.greeting + String(lead.name || '').trim() + '.',
      '',
      labels.intro,
      '',
      labels.finalScore + ': ' + String(score.finalScore || ''),
      labels.level + ': ' + String(score.level && score.level.title ? score.level.title : ''),
      '',
      labels.diagnosis + ':',
      aiReport || String(score.diagnostic || ''),
      '',
      labels.scoreByDimension + ':',
      dimensionLines,
      '',
      labels.attentionPoints + ':',
      attentionPoints,
      '',
      labels.nextStep,
      '',
      'Caldeira Growth'
    ].join('\n');

    MailApp.sendEmail(email, labels.subject, body);
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

function appendMappedRow_(sheet, headers, rowObject) {
  ensureHeaders_(sheet, headers);
  var lastColumn = sheet.getLastColumn();
  var currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || '').trim();
  });
  var row = currentHeaders.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowObject, header) ? rowObject[header] : '';
  });
  sheet.appendRow(row);
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
