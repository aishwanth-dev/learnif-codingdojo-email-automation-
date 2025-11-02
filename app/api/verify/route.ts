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

    // Process private key: handle environment variable formatting
    // Remove surrounding quotes if present
    privateKey = privateKey.trim().replace(/^["']+|["']+$/g, '');
    
    // Replace escaped newlines with actual newlines (handle both \n and \\n)
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Ensure we have proper BEGIN/END markers
    if (!privateKey.startsWith('-----BEGIN')) {
      // Try to reconstruct if BEGIN marker is missing but key exists
      if (privateKey.includes('PRIVATE KEY')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey.replace(/-----END PRIVATE KEY-----/g, '').trim() + '\n-----END PRIVATE KEY-----\n';
      } else {
        console.error('[VERIFY] ✗ Private key format appears invalid (missing BEGIN marker)');
        console.error('[VERIFY] First 50 chars of key:', privateKey.substring(0, 50));
        throw new Error('Invalid private key format: missing BEGIN marker');
      }
    }
    
    // Verify the key ends properly
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      console.error('[VERIFY] ✗ Private key format appears invalid (missing END marker)');
      console.error('[VERIFY] Last 50 chars of key:', privateKey.substring(Math.max(0, privateKey.length - 50)));
      throw new Error('Invalid private key format: missing END marker');
    }
    
    console.log('[VERIFY] ✓ Private key formatted correctly');
    console.log('[VERIFY] Private key length:', privateKey.length);
    console.log('[VERIFY] Private key starts with:', privateKey.substring(0, 30));
    console.log('[VERIFY] Private key ends with:', privateKey.substring(Math.max(0, privateKey.length - 30)));

    // Create JWT authentication client
    let jwt: JWT;
    try {
      jwt = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      console.log('[VERIFY] ✓ JWT client created successfully');
    } catch (jwtError: unknown) {
      const error = jwtError as Error & { code?: string };
      console.error('[VERIFY] ✗ Failed to create JWT client:', error?.message);
      console.error('[VERIFY] JWT error code:', error?.code);
      console.error('[VERIFY] This usually means the private key format is incorrect');
      throw new Error(`JWT authentication setup failed: ${error?.message || 'Invalid private key format'}`);
    }

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
    let foundRow: any = null;
    let decodedEmail: string | null = null;
    
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
    } catch (e: unknown) {
      // Token decode failed, return error
      const error = e as Error;
      console.error('[VERIFY] ✗ Token decode error:', error?.message || e);
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[VERIFY] ✗ Error verifying email:', err);
    console.error('[VERIFY] Error details:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to verify email. Please try again.',
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined
      },
      { status: 500 }
    );
  }
}

