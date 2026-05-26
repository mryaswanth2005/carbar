const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const target = ['https://www.googleapis.com/auth/spreadsheets'];
  let pk = process.env.GOOGLE_PRIVATE_KEY || '';
  if (pk.startsWith('"') && pk.endsWith('"')) {
    pk = pk.slice(1, -1);
  }
  pk = pk.replace(/\\n/g, '\n');
  
  const jwt = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: pk,
    scopes: target
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });

  // Update row 2 (yaswanthravi005)
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Admins!A2:G2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['EMP0000002', 'yaswanthravi005@gmail.com', '12345678', 'staff', 'Active', 'Date', '2026-05-26T04:14:51.675Z']
      ]
    }
  });

  console.log('Update successful.');
}

run().catch(console.error);
