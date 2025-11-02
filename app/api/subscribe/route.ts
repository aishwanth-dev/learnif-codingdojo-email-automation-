import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as nodemailer from 'nodemailer';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[SUBSCRIBE] Starting subscription process...');
  try {
    const { email } = await request.json();
    console.log('[SUBSCRIBE] Received email:', email);

    if (!email || !email.includes('@')) {
      console.error('[SUBSCRIBE] Invalid email format:', email);
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
    const normalizedEmail = email.toLowerCase().trim();
    if (headerMap['email']) {
      rowData[headerMap['email']] = normalizedEmail;
      console.log('[SUBSCRIBE] Using email column:', headerMap['email']);
    }
    if (headerMap['verification']) {
      rowData[headerMap['verification']] = 'pending';
      console.log('[SUBSCRIBE] Setting verification to: pending');
    }
    if (headerMap['date']) {
      const dateValue = new Date().toISOString();
      rowData[headerMap['date']] = dateValue;
      console.log('[SUBSCRIBE] Setting date to:', dateValue);
    }
    
    console.log('[SUBSCRIBE] Row data to save:', rowData);
    
    // Add the row
    const row = await sheet.addRow(rowData);
    console.log('[SUBSCRIBE] ✓ Row added to spreadsheet successfully');
    
    // Generate verification token
    const timestamp = new Date().getTime();
    const tokenData = `${normalizedEmail}|${timestamp}`;
    const token = Buffer.from(tokenData).toString('base64');
    console.log('[SUBSCRIBE] Generated verification token');
    
    // Get website URL
    const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    const verificationUrl = `${websiteUrl}/verify?token=${encodeURIComponent(token)}`;
    console.log('[SUBSCRIBE] Verification URL:', verificationUrl);
    
    // Send verification email
    try {
      console.log('[SUBSCRIBE] Attempting to send verification email to:', normalizedEmail);
      await sendVerificationEmail(normalizedEmail, verificationUrl);
      console.log('[SUBSCRIBE] ✓ Verification email sent successfully');
    } catch (emailError: any) {
      console.error('[SUBSCRIBE] ✗ Error sending email:', emailError?.message || emailError);
      console.error('[SUBSCRIBE] Email error stack:', emailError?.stack);
      // Don't fail the request if email fails, just log it
    }

    console.log('[SUBSCRIBE] ✓ Subscription process completed successfully');
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

/**
 * Send verification email using SMTP
 */
async function sendVerificationEmail(email: string, verificationUrl: string) {
  console.log('[EMAIL] Starting email send process...');
  
  // SMTP configuration from environment
  const smtpHost = process.env.SMTP_HOST || 'mail.privateemail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpUser = process.env.SMTP_USER || 'no-reply@16xstudios.space';
  const smtpPassword = process.env.SMTP_PASSWORD || 'aishwanth1234';

  console.log('[EMAIL] SMTP Config:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    secure: smtpPort === 465
  });

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  // Email HTML template
  const htmlBody = getEmailTemplate(verificationUrl);

  // Send email
  const mailOptions = {
    from: `"learnif." <${smtpUser}>`,
    to: email,
    subject: 'Verify Your Email - learnif.',
    html: htmlBody,
    text: `Verify your email by clicking this link: ${verificationUrl}`,
  };

  console.log('[EMAIL] Sending email with options:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  const info = await transporter.sendMail(mailOptions);
  console.log('[EMAIL] ✓ Email sent successfully. Message ID:', info.messageId);
}

/**
 * Get HTML email template - Glassmorphism theme matching website
 */
function getEmailTemplate(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your Email - learnif.</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
    .button-cell { padding: 20px !important; }
    .glass-card { background-color: rgba(255, 255, 255, 0.15) !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; background-image: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <!-- Background Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a; background-image: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        
        <!-- Glass Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 540px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);" class="glass-card">
          
          <!-- Logo/Icon with Glass Effect -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="padding: 16px 24px; background: rgba(255, 255, 255, 0.08); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);">
                    <span style="font-size: 28px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.5px; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">learnif.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding: 0 40px 20px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 500; color: #FFFFFF; letter-spacing: -0.3px; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.3;">
                Please verify your <span style="font-family: 'Edu NSW ACT Cursive', cursive; font-weight: 700; font-size: 36px; color: #FFFFFF;">email</span>
              </h1>
            </td>
          </tr>

          <!-- Instructional Text -->
          <tr>
            <td align="center" style="padding: 0 40px 36px;">
              <p style="margin: 0; font-size: 16px; font-weight: 400; color: rgba(255, 255, 255, 0.8); line-height: 1.6; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                You’re almost in! Verify your email below and begin something inspiring with learnif.
              </p>
            </td>
          </tr>

          <!-- Verification Button -->
          <tr>
            <td align="center" class="button-cell" style="padding: 0 40px 40px;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 500; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: -0.2px; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);">
                Verify my account
              </a>
            </td>
          </tr>

          <!-- Separator -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: rgba(255, 255, 255, 0.15);"></div>
            </td>
          </tr>

          <!-- Footer Text -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px;">
              <p style="margin: 0; font-size: 14px; font-weight: 400; color: rgba(255, 255, 255, 0.6); line-height: 1.6; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                You're receiving this email because you signed up for learnif. If you are not sure why you're receiving this, please contact us by replying to this email.
              </p>
            </td>
          </tr>

          <!-- Separator -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: rgba(255, 255, 255, 0.15);"></div>
            </td>
          </tr>

          <!-- Attribution Box with Glass Effect -->
          <tr>
            <td style="padding: 24px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 15px; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.6; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center;">
                      Daily coding questions, complete answers, endless growth. Turn your inbox into your <span style="font-family: 'Edu NSW ACT Cursive', cursive; font-weight: 700; font-size: 17px; color: rgba(255, 255, 255, 0.9);">coding</span> dojo with learnif.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Bottom Copyright -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 540px; margin: 32px auto 0;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="margin: 0; font-size: 12px; font-weight: 400; color: rgba(255, 255, 255, 0.4); font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                © ${new Date().getFullYear()} learnif. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

