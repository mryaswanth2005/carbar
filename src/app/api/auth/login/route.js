import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getGoogleSheetsAuth() {
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
  return google.sheets({ version: 'v4', auth: jwt });
}

const HEADERS = ['Employee ID', 'Email', 'Password', 'Role', 'Status', 'Permissions', 'Access Permissions', 'Created At'];
const RANGE = 'Admins!A:H';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or employee ID

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/Employee ID and password are required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();

    // Fetch data from the Admins sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or no admins configured.' }, { status: 401 });
    }

    // Check if the first row is actually a header row
    const firstCell = rows[0] && rows[0][0] ? rows[0][0].toString().toLowerCase() : '';
    const secondCell = rows[0] && rows[0][1] ? rows[0][1].toString().toLowerCase() : '';
    const isHeaderRow = firstCell.includes('employee') || firstCell.includes('email') || secondCell.includes('email');

    const dataStartIndex = isHeaderRow ? 1 : 0;

    let authenticatedAdmin = null;

    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i];
      const empId = (row[0] || '').toString().trim().toLowerCase();
      const email = (row[1] || '').toString().trim().toLowerCase();
      const rowPassword = (row[2] || '').toString();

      const searchIdentifier = identifier.toString().trim().toLowerCase();

      // Check if identifier matches Email or Employee ID, and Password matches
      if ((searchIdentifier === email || searchIdentifier === empId) && password === rowPassword) {

        // Ensure the account is active
        const status = (row[4] || '').toString().toLowerCase();
        if (status === 'inactive') {
          return NextResponse.json({ error: 'Your account is currently inactive. Please contact your manager.' }, { status: 403 });
        }

        // Build the admin object
        authenticatedAdmin = {};
        HEADERS.forEach((header, colIndex) => {
          authenticatedAdmin[header] = row[colIndex] || '';
        });

        // Add row index so they can change their password later
        authenticatedAdmin['_rowIndex'] = i + 1; // Google Sheets is 1-indexed

        // Don't send the password back to the client!
        delete authenticatedAdmin['Password'];

        break;
      }
    }

    if (authenticatedAdmin) {
      return NextResponse.json({ success: true, user: authenticatedAdmin });
    } else {
      return NextResponse.json({ error: 'Invalid Employee ID/Email or Password' }, { status: 401 });
    }

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again later.' },
      { status: 500 }
    );
  }
}
