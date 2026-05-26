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

export async function GET(request) {
  try {
    const sheets = await getGoogleSheetsAuth();

    // Fetch data from the Admins sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Check if the first row is actually a header row
    // It might be 'employee id' or 'email' depending on how they set it up
    const firstCell = rows[0] && rows[0][0] ? rows[0][0].toString().toLowerCase() : '';
    const secondCell = rows[0] && rows[0][1] ? rows[0][1].toString().toLowerCase() : '';
    const isHeaderRow = firstCell.includes('employee') || firstCell.includes('email') || secondCell.includes('email');

    const dataStartIndex = isHeaderRow ? 1 : 0;

    const data = rows.slice(dataStartIndex).map((row, index) => {
      const obj = {};
      HEADERS.forEach((header, colIndex) => {
        obj[header] = row[colIndex] || '';
      });
      // Keep track of the original row index for editing/deleting (0-indexed + dataStartIndex + 1 for Google Sheets 1-indexing)
      obj['_rowIndex'] = index + dataStartIndex + 1;
      return obj;
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins data. Ensure a sheet named "Admins" exists.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, email, password, role, status, permissions, accessPermissions } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();
    const createdAt = new Date().toISOString();
    const permissionsString = Array.isArray(permissions) ? permissions.join(', ') : permissions;
    const accessString = Array.isArray(accessPermissions) ? accessPermissions.join(',') : (accessPermissions || 'View');

    // Append data to the Admins sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [employeeId || '', email, password, role || 'staff', status || 'Active', permissionsString, accessString, createdAt]
        ]
      }
    });

    return NextResponse.json({ success: true, message: 'Admin added successfully' });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { error: 'Failed to add admin.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { _rowIndex, employeeId, email, password, role, status, permissions, accessPermissions, originalCreatedAt } = body;

    if (!_rowIndex) {
      return NextResponse.json({ error: 'Row index is required for updating' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();
    const permissionsString = Array.isArray(permissions) ? permissions.join(', ') : permissions;
    const accessString = Array.isArray(accessPermissions) ? accessPermissions.join(',') : (accessPermissions || 'View');

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Admins!A${_rowIndex}:H${_rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [employeeId || '', email, password, role || 'staff', status || 'Active', permissionsString, accessString, originalCreatedAt]
        ]
      }
    });

    return NextResponse.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex'), 10);

    if (!rowIndex || isNaN(rowIndex)) {
      return NextResponse.json({ error: 'Valid Row index is required for deletion' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();

    // Get the sheet ID for the "Admins" sheet to perform a dimension deletion
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Admins');
    if (!sheet) {
      throw new Error('Admins sheet not found');
    }
    const sheetId = sheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed and inclusive
                endIndex: rowIndex        // 0-indexed and exclusive
              }
            }
          }
        ]
      }
    });

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin.' },
      { status: 500 }
    );
  }
}
