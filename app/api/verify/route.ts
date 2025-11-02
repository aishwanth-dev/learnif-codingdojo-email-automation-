import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[VERIFY] Starting verification process...');
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    console.log('[VERIFY] Received token:', token ? `${token.substring(0, 20)}...` : 'none');

    if (!token) {
      console.error('[VERIFY] ✗ No token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

    if (!sheetId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Remove quotes from private key if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Create JWT authentication client
    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize the sheet
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      throw new Error('No sheet found in the document');
    }

    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    
    // Find email and verification columns
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header.toLowerCase()] = index;
    });

    const emailColIndex = headerMap['email'];
    const verificationColIndex = headerMap['verification'];

    console.log('[VERIFY] Found headers:', headers);
    console.log('[VERIFY] Email column index:', emailColIndex);
    console.log('[VERIFY] Verification column index:', verificationColIndex);

    if (emailColIndex === undefined || verificationColIndex === undefined) {
      console.error('[VERIFY] ✗ Required columns not found');
      throw new Error('Required columns not found');
    }

    // Get all rows
    await sheet.loadCells();
    const rows = await sheet.getRows();

    // Find the row with matching token
    // Token format: base64(email|timestamp)
    let foundRow = null;
    let decodedEmail = null;
    
    try {
      // Decode token to get email
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      console.log('[VERIFY] Decoded token data:', decoded);
      const [email, timestamp] = decoded.split('|');
      
      if (!email || !timestamp) {
        throw new Error('Invalid token format');
      }

      decodedEmail = email.toLowerCase().trim();
      console.log('[VERIFY] Looking for email:', decodedEmail);
      console.log('[VERIFY] Total rows to check:', rows.length);

      // Find row by email
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowEmail = row.get(headers[emailColIndex]);
        const rowEmailLower = rowEmail ? rowEmail.toString().toLowerCase().trim() : '';
        const currentVerification = row.get(headers[verificationColIndex]);
        
        console.log(`[VERIFY] Row ${i + 1}: email="${rowEmailLower}", verification="${currentVerification}"`);
        
        if (rowEmailLower === decodedEmail) {
          foundRow = row;
          console.log('[VERIFY] ✓ Found matching row at index:', i + 1);
          console.log('[VERIFY] Current verification status:', currentVerification);
          break;
        }
      }
    } catch (e: any) {
      // Token decode failed, return error
      console.error('[VERIFY] ✗ Token decode error:', e?.message || e);
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (!foundRow) {
      console.error('[VERIFY] ✗ No matching row found for email:', decodedEmail);
      console.error('[VERIFY] Searched through', rows.length, 'rows');
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update verification status to "done"
    const verificationHeader = headers[verificationColIndex];
    console.log('[VERIFY] Updating verification column:', verificationHeader);
    console.log('[VERIFY] Setting status to: done');
    
    foundRow.set(verificationHeader, 'done');
    await foundRow.save();
    
    console.log('[VERIFY] ✓ Verification status updated to "done" successfully');
    console.log('[VERIFY] ✓ Verification process completed for:', decodedEmail);

    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify email. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

