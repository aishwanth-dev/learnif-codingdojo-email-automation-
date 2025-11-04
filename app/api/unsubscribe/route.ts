import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Decode token: base64(email|timestamp)
    let email: string | null = null;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [e] = decoded.split('|');
      email = (e || '').toLowerCase().trim();
      if (!email || !email.includes('@')) throw new Error('bad email');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    if (!sheetId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    privateKey = privateKey.trim().replace(/^["']+|["']+$/g, '').replace(/\\n/g, '\n');
    if (!privateKey.startsWith('-----BEGIN')) {
      if (privateKey.includes('PRIVATE KEY')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey.replace(/-----END PRIVATE KEY-----/g, '').trim() + '\n-----END PRIVATE KEY-----\n';
      } else {
        return NextResponse.json({ error: 'Invalid key' }, { status: 500 });
      }
    }

    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });
    }

    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    const headerMap: Record<string, string> = {};
    headers.forEach((h: string) => (headerMap[h.toLowerCase()] = h));
    const emailColumn = headerMap['email'];
    if (!emailColumn) {
      return NextResponse.json({ error: 'Email column missing' }, { status: 500 });
    }

    const rows = await sheet.getRows();
    let deleted = false;
    for (const row of rows) {
      const rowEmail = (row.get(emailColumn) || '').toString().toLowerCase().trim();
      if (rowEmail === email) {
        await row.delete();
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, email });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}


