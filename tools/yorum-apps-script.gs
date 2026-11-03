// Google Apps Script for the review comments (assets/js/yorum.js).
// Setup:
//   1. Create a Google Sheet. Extensions → Apps Script. Replace the code there with this file. Save.
//   2. Deploy → New deployment → type "Web app". Execute as: Me. Who has access: Anyone. Deploy.
//   3. Allow the permissions it asks for. Copy the Web app URL (ends in /exec).
//   4. Paste that URL into ENDPOINT at the top of assets/js/yorum.js.
// After changing this script: Deploy → Manage deployments → edit (pencil) → Version: New version →
// Deploy. The URL stays the same; without a new version the old code keeps running.
//
// API (all answers are JSON with ok: true|false):
//   GET  ?page=<page>                          → { comments: [...] } for that page, oldest first
//   POST { action: "create", page, comment, … } → { id, time }
//   POST { action: "update", id, comment }      → { updated }
//   POST { action: "delete", id }               → {}

const SHEET_NAME = 'Yorumlar';
const HEADERS = ['ID', 'Zaman', 'Güncellendi', 'Sayfa', 'Yorum', 'Tıklanan öğe (metin)', 'Seçici',
  'Öğe içi X', 'Öğe içi Y', 'X (px)', 'Y (px)', 'X (%)', 'Ekran'];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i + 1]));

function doGet(e) {
  try {
    const page = String(e.parameter.page || '');
    const sheet = getSheet();
    const n = sheet.getLastRow() - 1;
    const rows = n > 0 ? sheet.getRange(2, 1, n, HEADERS.length).getValues() : [];
    const comments = rows
      .filter((r) => r[0] && r[COL['Sayfa'] - 1] === page)
      .map((r) => ({
        id: String(r[0]),
        time: iso(r[COL['Zaman'] - 1]),
        updated: iso(r[COL['Güncellendi'] - 1]),
        comment: String(r[COL['Yorum'] - 1]),
        selector: String(r[COL['Seçici'] - 1]),
        ox: Number(r[COL['Öğe içi X'] - 1]) || 0,
        oy: Number(r[COL['Öğe içi Y'] - 1]) || 0,
        x: Number(r[COL['X (px)'] - 1]) || 0,
        y: Number(r[COL['Y (px)'] - 1]) || 0,
        xPct: Number(r[COL['X (%)'] - 1]) || 0,
      }));
    return json({ ok: true, comments });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const sheet = getSheet();
    const now = new Date();

    if (d.action === 'create') {
      const id = Utilities.getUuid();
      const row = [];
      row[COL['ID'] - 1] = id;
      row[COL['Zaman'] - 1] = now;
      row[COL['Güncellendi'] - 1] = '';
      row[COL['Sayfa'] - 1] = clean(d.page, 300);
      row[COL['Yorum'] - 1] = clean(d.comment, 5000);
      row[COL['Tıklanan öğe (metin)'] - 1] = clean(d.element, 300);
      row[COL['Seçici'] - 1] = clean(d.selector, 1000);
      row[COL['Öğe içi X'] - 1] = Number(d.ox) || 0;
      row[COL['Öğe içi Y'] - 1] = Number(d.oy) || 0;
      row[COL['X (px)'] - 1] = Number(d.x) || 0;
      row[COL['Y (px)'] - 1] = Number(d.y) || 0;
      row[COL['X (%)'] - 1] = Number(d.xPct) || 0;
      row[COL['Ekran'] - 1] = clean(d.viewport, 30);
      sheet.appendRow(row);
      return json({ ok: true, id, time: now.toISOString() });
    }

    const r = findRow(sheet, String(d.id || ''));
    if (!r) return json({ ok: false, error: 'not found' });

    if (d.action === 'update') {
      sheet.getRange(r, COL['Yorum']).setValue(clean(d.comment, 5000));
      sheet.getRange(r, COL['Güncellendi']).setValue(now);
      return json({ ok: true, updated: now.toISOString() });
    }
    if (d.action === 'delete') {
      sheet.deleteRow(r);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// The comments tab. A tab with other headers (the first version had no ID column) is renamed
// to "Yorumlar (eski)" and kept; a fresh tab is made with the current headers.
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) {
    const head = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (head.join('|') === HEADERS.join('|')) return sheet;
    sheet.setName(SHEET_NAME + ' (eski)');
  }
  sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function findRow(sheet, id) {
  if (!id || sheet.getLastRow() < 2) return 0;
  const cell = sheet.getRange(2, COL['ID'], sheet.getLastRow() - 1, 1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function iso(v) {
  return v instanceof Date ? v.toISOString() : (v ? String(v) : '');
}

// Text that starts with = + - @ would run as a spreadsheet formula; a leading ' keeps it plain text.
function clean(value, max) {
  const s = String(value == null ? '' : value).slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
