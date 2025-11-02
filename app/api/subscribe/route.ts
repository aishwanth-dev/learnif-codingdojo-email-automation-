import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

    if (!sheetId || !serviceAccountEmail || !privateKey) {
      console.error('Missing environment variables:', {
        hasSheetId: !!sheetId,
        hasEmail: !!serviceAccountEmail,
        hasKey: !!privateKey,
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Remove quotes from private key if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Create JWT authentication client
    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize the sheet with JWT authentication
    const doc = new GoogleSpreadsheet(sheetId, jwt);

    await doc.loadInfo();
    
    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      throw new Error('No sheet found in the document');
    }
    
    // Load header row to ensure column names match
    await sheet.loadHeaderRow();
    
    // Get the actual header values to match them exactly
    const headers = sheet.headerValues;
    console.log('Sheet headers:', headers);
    
    // Create row data matching the exact header names
    const rowData: any = {};
    const headerMap: { [key: string]: string } = {};
    
    // Create a case-insensitive mapping
    headers.forEach((header: string) => {
      headerMap[header.toLowerCase()] = header;
    });
    
    // Map our values to the correct header names
    if (headerMap['email']) {
      rowData[headerMap['email']] = email;
    }
    if (headerMap['verification']) {
      rowData[headerMap['verification']] = 'pending';
    }
    if (headerMap['date']) {
      rowData[headerMap['date']] = new Date().toISOString();
    }
    
    // Add the row
    await sheet.addRow(rowData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving email:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to save email. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

