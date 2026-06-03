/**
 * Web App: recebe POST JSON do site Caldeira Growth e grava uma linha na planilha.
 * Colunas: timestamp, nome, email, empresa, cargo, tema, mensagem
 */
var SPREADSHEET_ID = '1NivGOjutCgJTGDjXxt8ydFiCeWrKvbbIdqmkVmwSC9M';
var ARTICLES_SHEET_NAME = 'Artigos';
var MEDIA_SHEET_NAME = 'Midia';
var ARTICLES_HEADERS = ['status', 'date', 'slug', 'title_pt', 'title_en', 'excerpt_pt', 'excerpt_en', 'content_pt', 'content_en', 'cover_url', 'source_name', 'source_url'];
var MEDIA_HEADERS = ['status', 'date', 'title_pt', 'title_en', 'outlet', 'url', 'cover_url', 'featured'];

function doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || '').trim();
    if (action === 'articles_csv') {
      return csvResponse_(getSheetCsv_(ARTICLES_SHEET_NAME, ARTICLES_HEADERS));
    }
    if (action === 'media_csv') {
      return csvResponse_(getSheetCsv_(MEDIA_SHEET_NAME, MEDIA_HEADERS));
    }
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    var action = String(payload.action || payload.type || '').trim().toLowerCase();

    if (action === 'article') {
      return handleArticlePost_(payload);
    }
    if (action === 'media') {
      return handleMediaPost_(payload);
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
    return JSON.parse(e.postData.contents);
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

  return sheet;
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
