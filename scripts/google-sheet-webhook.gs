/**
 * Google Sheet lead capture + email delivery for The Branding Whisperer.
 *
 * What it does: every time a visitor taps "Email it to me", this script
 * adds a row to your sheet (date, email, their brand summary) AND emails
 * them their summary from your Google account.
 *
 * SETUP (one time, ~3 minutes):
 * 1. Go to sheets.new, name the sheet "Branding Whisperer Leads".
 *    In row 1, type headers: Date | Email | Brand summary
 * 2. In the sheet menu: Extensions, then Apps Script. Delete any code there
 *    and paste this whole file. Save.
 * 3. Run the authorizeMe function once (pick it in the toolbar, click Run) and
 *    approve EVERY permission Google asks for, including "Send email as you."
 *    This is the step that grants the send-email scope; skipping it makes the
 *    email fail silently.
 * 4. Click "Deploy", then "New deployment", gear icon, "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click "Deploy".
 * 5. Copy the "Web app URL" it gives you (ends in /exec).
 * 6. Put that URL in your .env as SHEETS_WEBHOOK_URL (and in Vercel, under
 *    Project Settings, Environment Variables).
 *
 * Note: free Google accounts can send ~100 emails/day this way. Plenty to
 * start. When you outgrow it, swap in a proper email service and keep the
 * sheet as your lead log.
 */

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // 1. Log the lead
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([new Date(), data.email, data.summary]);

  // 2. Send them their summary
  MailApp.sendEmail({
    to: data.email,
    subject: "Your brand, from The Branding Whisperer",
    body:
      data.summary +
      "\n\nYou asked for this on The Branding Whisperer. Keep it somewhere you'll see it.\n" +
      "Keep an eye out. 5 fresh post ideas are coming your way next week.",
  });

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Run this ONCE from the editor to grant the sheet + email permissions.
// It touches both SpreadsheetApp and MailApp so Google's consent screen asks
// for every permission the webhook needs, then finishes cleanly.
function authorizeMe() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
}
