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

export async function GET(request) {
  try {
    const sheets = await getGoogleSheetsAuth();

    // First, get spreadsheet metadata to find the name of the first sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    const firstSheetTitle = spreadsheet.data.sheets[0].properties.title;

    // Fetch data from the first sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `'${firstSheetTitle}'!A1:Z1000`, // Fetch a large range
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Find the actual header row (some sheets have title rows at the top)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowStr = (rows[i] || []).join(' ').toLowerCase();
      if (rowStr.includes('date') && rowStr.includes('party')) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rows[headerRowIndex].map(h => h ? h.trim() : '');

    // Filter out completely empty columns from headers
    const validHeaderIndices = [];
    const cleanHeaders = [];
    headers.forEach((h, idx) => {
      if (h) {
        validHeaderIndices.push(idx);
        cleanHeaders.push(h);
      }
    });

    const data = rows.slice(headerRowIndex + 1).map((row, index) => {
      const obj = {};
      let hasData = false;
      validHeaderIndices.forEach((colIndex, i) => {
        const val = row[colIndex] || '';
        obj[cleanHeaders[i]] = val;
        if (val) hasData = true;
      });
      obj['_rowIndex'] = headerRowIndex + index + 2;
      return hasData ? obj : null;
    }).filter(Boolean); // remove empty rows

    return NextResponse.json({
      data,
      headers: cleanHeaders
    });
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { _rowIndex, updates } = body;

    if (!_rowIndex) {
      return NextResponse.json({ error: 'Row index is required for updating' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    const firstSheetTitle = spreadsheet.data.sheets[0].properties.title;

    // We need to fetch the existing data to map headers to columns
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `'${firstSheetTitle}'!A1:Z1000`,
    });

    const rows = response.data.values;
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowStr = (rows[i] || []).join(' ').toLowerCase();
      if (rowStr.includes('date') && rowStr.includes('party')) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rows[headerRowIndex].map(h => h ? h.trim() : '');

    // Get the specific row data
    const currentRowIndex = parseInt(_rowIndex, 10) - 1; // Array index
    // If the row doesn't exist yet for some reason (e.g. empty sheet), create a blank array
    const currentRow = rows[currentRowIndex] || [];

    // Merge updates into currentRow based on header positions
    const newRow = [...currentRow];
    headers.forEach((h, idx) => {
      // If the user provided an update for this specific header, overwrite it
      if (h && updates.hasOwnProperty(h)) {
        newRow[idx] = updates[h];
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `'${firstSheetTitle}'!A${_rowIndex}:Z${_rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({ success: true, message: 'Row updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ error: 'Failed to update row.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex'), 10);

    if (!rowIndex || isNaN(rowIndex)) {
      return NextResponse.json({ error: 'Valid Row index is required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

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

    return NextResponse.json({ success: true, message: 'Row deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Failed to delete row.' }, { status: 500 });
  }
}
