// Paste this into a Google Apps Script attached to your waitlist Sheet.
// Tools → Apps Script → paste → Deploy → Web app → Execute as Me, Access Anyone.
// Then copy the /exec URL it gives you.

const SHEET_NAME = 'Waitlist';

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Email', 'Referrer', 'User Agent']);
      sheet.setFrozenRows(1);
    }

    const p = (e && e.parameter) || {};
    const email = String(p.email || '').trim().toLowerCase();

    if (!email || email.indexOf('@') === -1) {
      return json({ ok: false, error: 'invalid_email' });
    }

    // Optional: skip duplicates
    const existing = sheet.getRange(2, 2, Math.max(0, sheet.getLastRow() - 1), 1).getValues().flat();
    if (existing.includes(email)) {
      return json({ ok: true, duplicate: true });
    }

    sheet.appendRow([new Date(), email, p.referrer || '', p.userAgent || '']);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, hint: 'POST email to record a signup.' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
