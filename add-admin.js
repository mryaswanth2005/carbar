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
  
  const newAdminRow = [
    'ADMIN001',
    'admin@workeazi.com',
    'admin123',
    'admin',
    'Active',
    'Dashboard',
    new Date().toISOString()
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Admins!A:G',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [newAdminRow],
    },
  });
  
  console.log('Admin added successfully.');
}

run().catch(console.error);
