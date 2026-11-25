/**
 * Sincerely Unsaid: stores every form submission and emails it to you.
 *
 * What it does: each guest request, letter or voice note sent from
 * /sincerelyunsaid becomes a row in your sheet (with the permission boxes and
 * a timestamp) AND an email to NOTIFY below. Voice notes are saved to a Drive
 * folder called "Sincerely Unsaid voice notes" and attached to the email.
 *
 * SETUP (one time):
 * 1. Go to sheets.new, name the sheet "Sincerely Unsaid Submissions".
 *    In row 1, type headers:
 *    Received | Kind | Sign as | Name | Email | To or about | Words | Link | Permissions | Audio
 * 2. In the sheet menu: Extensions, then Apps Script. Delete any code there
 *    and paste this whole file.
 * 3. Set TOKEN below to a long random string, and check NOTIFY. Save.
 * 4. Run the authorizeMe function once (pick it in the toolbar, click Run) and
 *    approve every permission Google asks for (Sheets, send email, Drive).
 * 5. Click "Deploy", then "New deployment", gear icon, "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click "Deploy" and copy the "Web app URL" (ends in /exec).
 * 6. In Vercel, Project Settings, Environment Variables, add:
 *      UNSAID_WEBHOOK_URL   = that web app URL
 *      UNSAID_WEBHOOK_TOKEN = the same string as TOKEN below
 *    (and in a local .env file if you run the site on your computer).
 */

const NOTIFY = "safrin@brandinginward.com";
const TOKEN = "PASTE-THE-SAME-LONG-RANDOM-STRING-HERE";
const FOLDER = "Sincerely Unsaid voice notes";

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) return reply({ ok: false });

  const anon = d.sign === "anon";
  const signAs = { full: "Full name", first: "First name only", anon: "ANONYMOUS" }[d.sign] || d.sign;
  const permissions = d.consents
    ? Object.keys(d.consents).map(function (k) { return k + ": " + (d.consents[k] ? "yes" : "no"); }).join(", ") + " (at " + d.received_at + ")"
    : "";

  // Voice note: keep the file in Drive and attach it to the email.
  let audioUrl = "";
  let attachments = [];
  if (d.audio_base64) {
    const blob = Utilities.newBlob(Utilities.base64Decode(d.audio_base64), d.audio_type, d.audio_name);
    const folders = DriveApp.getFoldersByName(FOLDER);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER);
    audioUrl = folder.createFile(blob).getUrl();
    attachments = [blob];
  }

  const toOrAbout = d.to || d.about || "";
  const words = d.letter || d.story || "";

  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().appendRow([
    d.received_at, d.kind, signAs, d.name, d.email, toOrAbout, words, d.link || "", permissions, audioUrl,
  ]);

  const subject = {
    guest: "Sincerely Unsaid: guest request from " + d.name,
    letter: "Sincerely Unsaid: a letter to " + toOrAbout,
    voice: "Sincerely Unsaid: a voice note about " + toOrAbout,
  }[d.kind];

  const lines = [
    anon ? "ANONYMOUS. Do not read or show the name." : "Sign as: " + signAs,
    "Name: " + (d.name || "(not given)"),
    "Email (private): " + d.email,
  ];
  if (d.link) lines.push("Find them: " + d.link);
  if (toOrAbout) lines.push((d.kind === "letter" ? "Dear " : "About: ") + toOrAbout);
  if (permissions) lines.push("Permissions: " + permissions);
  if (audioUrl) lines.push("Recording: " + audioUrl);
  if (words) lines.push("", words);

  MailApp.sendEmail({ to: NOTIFY, replyTo: d.email, subject: subject, body: lines.join("\n"), attachments: attachments });

  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this ONCE from the editor so Google asks for every permission the
// webhook needs (Sheets, send email, Drive), then finishes cleanly.
function authorizeMe() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder().getName();
}
