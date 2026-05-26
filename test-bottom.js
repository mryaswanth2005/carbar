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
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });
  
  const firstSheetTitle = spreadsheet.data.sheets[0].properties.title;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: '\'!A1:Z,
  });
  
  console.log('Total rows:', response.data.values.length);
  console.log('Last 3 rows:');
  console.log(response.data.values.slice(-3));
}
run().catch(console.error);
