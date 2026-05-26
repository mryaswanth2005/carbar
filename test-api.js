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
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Admins!A:G',
  });
  
  console.log('Range fetched:', response.data.range);
  
  const rows = response.data.values;
  const headers = ['Employee ID', 'Email', 'Password', 'Role', 'Status', 'Permissions', 'Created At'];
  const isHeaderRow = rows[0] && rows[0][0] && rows[0][0].toString().toLowerCase() === 'email';
  const dataStartIndex = isHeaderRow ? 1 : 0;
  
  const data = rows.slice(dataStartIndex).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
