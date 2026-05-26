import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';

export const dynamic = 'force-dynamic';

async function getGoogleSheetsAuth() {
  const target = ['https://www.googleapis.com/auth/spreadsheets'];
  const credentialsPath = path.join(process.cwd(), 'google-sheets-credentials.json');
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: target
  });
  
  return google.sheets({ version: 'v4', auth });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { newRow } = body;
    
    if (!newRow || !Array.isArray(newRow)) {
      return NextResponse.json({ error: 'Valid newRow array is required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsAuth();
    
    // First, get spreadsheet metadata to find the name of the first sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    
    const firstSheetTitle = spreadsheet.data.sheets[0].properties.title;
    
    // Append the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `'${firstSheetTitle}'`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return NextResponse.json({ success: true, message: 'Record added successfully' });
  } catch (error) {
    console.error('Error adding record to sheet:', error);
    return NextResponse.json({ error: 'Failed to add record' }, { status: 500 });
  }
}
