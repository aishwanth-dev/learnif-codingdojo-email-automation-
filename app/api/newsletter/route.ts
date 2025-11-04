import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

interface NewsletterData {
  title: string;
  topics: string[];
  read_time: string;
  questions: any[];
}

export async function POST(request: NextRequest) {
  console.log('[NEWSLETTER] Starting newsletter send process...');
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body?.batchSize || 45;

    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const driveFolderId = '1gEqwJAagwwRPrhUl7L3bcrOoMkY7cxc3'; // Fixed folder ID

    if (!sheetId || !serviceAccountEmail || !privateKey) {
      console.error('[NEWSLETTER] ✗ Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Process private key
    privateKey = privateKey.trim().replace(/^["']+|["']+$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    if (!privateKey.startsWith('-----BEGIN')) {
      if (privateKey.includes('PRIVATE KEY')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey.replace(/-----END PRIVATE KEY-----/g, '').trim() + '\n-----END PRIVATE KEY-----\n';
      } else {
        throw new Error('Invalid private key format');
      }
    }

    // Create JWT authentication client
    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'  // Need write access to update file descriptions
      ],
    });

    console.log('[NEWSLETTER] ✓ JWT client created successfully');

    // Get newsletter JSON from Drive
    const newsletterData = await getNewsletterFromDrive(jwt, driveFolderId);
    if (!newsletterData) {
      return NextResponse.json(
        { error: 'No newsletter data found' },
        { status: 404 }
      );
    }
    console.log('[NEWSLETTER] ✓ Newsletter data fetched from Drive');

    // Get emails from Google Sheet
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      throw new Error('No sheet found in the document');
    }
    
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    console.log('[NEWSLETTER] Sheet headers:', headers);

    // Get all rows
    const rows = await sheet.getRows();
    
    // Find emails where learncode is null or empty
    const headerMap: Record<string, string> = {};
    headers.forEach((header: string) => {
      headerMap[header.toLowerCase()] = header;
    });

    const emailColumn = headerMap['email'];
    const learncodeColumn = headerMap['learncode'];
    const verificationColumn = headerMap['verification'];

    if (!emailColumn || !learncodeColumn) {
      throw new Error('Required columns (email, learncode) not found in sheet');
    }

    // Filter rows where learncode is null/empty and verification is verified
    const eligibleRows = rows.filter(row => {
      const email = row.get(emailColumn);
      const learncode = row.get(learncodeColumn);
      const verification = row.get(verificationColumn);
      
      const isEligible = email && 
             (!learncode || learncode === '') && 
             (verification === 'verified' || verification === 'done');
      
      if (!isEligible && email) {
        console.log(`[NEWSLETTER] Skipping ${email}: verification="${verification}", learncode="${learncode}"`);
      }
      
      return isEligible;
    });

    console.log(`[NEWSLETTER] Found ${eligibleRows.length} eligible emails`);

    // Take first batchSize emails
    const batchToSend = eligibleRows.slice(0, batchSize);
    console.log(`[NEWSLETTER] Sending to ${batchToSend.length} emails`);

    if (batchToSend.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No emails to send',
        sent: 0 
      });
    }

    const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    
    // Send emails
    let sentCount = 0;
    let failedCount = 0;

    for (const row of batchToSend) {
      try {
        const email = row.get(emailColumn);
        const timestamp = Date.now();
        const token = Buffer.from(`${email}|${timestamp}`).toString('base64');
        const unsubscribeUrl = `${websiteUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
        const personalizedHtml = generateNewsletterHTML(newsletterData, unsubscribeUrl, String(email));
        await sendNewsletterEmail(email, personalizedHtml);
        
        // Mark as sent
        row.set(learncodeColumn, 'sent');
        await row.save();
        sentCount++;
        console.log(`[NEWSLETTER] ✓ Email sent to: ${email}`);
      } catch (error) {
        failedCount++;
        console.error(`[NEWSLETTER] ✗ Failed to send to row:`, error);
      }
    }

    console.log(`[NEWSLETTER] ✓ Process completed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      message: `Newsletter sent to ${sentCount} recipients`
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[NEWSLETTER] ✗ Fatal error:', err);
    console.error('[NEWSLETTER] Error details:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to send newsletter',
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get newsletter JSON from Google Drive folder
 */
async function getNewsletterFromDrive(jwt: JWT, folderId: string): Promise<NewsletterData | null> {
  try {
    console.log('[DRIVE] Fetching newsletter from Drive folder:', folderId);
    
    const drive = google.drive({ version: 'v3', auth: jwt });
    
    // List all files in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      orderBy: 'createdTime asc',
      fields: 'files(id, name, createdTime)',
    });

    const files = response.data.files || [];
    console.log('[DRIVE] Found JSON files:', files.map(f => f.name));

    // Find the first JSON file without "✅done" in the description or name
    for (const file of files) {
      if (!file.id || !file.name) continue;
      
      // Get file details including description
      const fileDetails = await drive.files.get({
        fileId: file.id,
        fields: 'id, name, description'
      });

      const description = fileDetails.data.description || '';
      
      // Skip if marked as done
      if (description.includes('✅done') || file.name.includes('✅done')) {
        console.log(`[DRIVE] Skipping ${file.name} (marked as done)`);
        continue;
      }

      // Download the file
      const fileData = await drive.files.get({
        fileId: file.id,
        alt: 'media'
      }, { responseType: 'text' });

      // Parse JSON
      const newsletterData = JSON.parse(fileData.data as string) as NewsletterData;
      console.log(`[DRIVE] ✓ Loaded newsletter: ${file.name}`);

      // Mark the file as done by updating description
      await drive.files.update({
        fileId: file.id,
        requestBody: {
          description: description ? `${description}\n✅done` : '✅done'
        }
      });
      console.log(`[DRIVE] ✓ Marked ${file.name} as done`);

      return newsletterData;
    }

    console.log('[DRIVE] No unprocessed newsletter files found');
    return null;
  } catch (error) {
    console.error('[DRIVE] ✗ Error fetching from Drive:', error);
    throw error;
  }
}

/**
 * Send newsletter email
 */
async function sendNewsletterEmail(email: string, htmlContent: string) {
  const smtpHost = process.env.SMTP_HOST || 'mail.privateemail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER || 'no-reply@16xstudios.space';
  const smtpPassword = process.env.SMTP_PASSWORD || 'aishwanth1234';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const mailOptions = {
    from: `"learnif." <${smtpUser}>`,
    to: email,
    subject: 'Daily Coding Challenge from learnif.',
    html: htmlContent,
    text: 'View this email in HTML format to see the full content.',
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Generate newsletter HTML from JSON data
 */
function generateNewsletterHTML(data: NewsletterData, unsubscribeUrl: string, toEmail?: string): string {
  const questionsHTML = data.questions.map(q => {
    if (q.type === 'coding') {
      return generateCodingQuestionHTML(q);
    } else if (q.type === 'interview_flow') {
      return generateInterviewFlowHTML(q);
    }
    return '';
  }).join('');

  const topicsHTML = data.topics.map(topic => `<li style="margin-bottom: 8px;">${escapeHtml(topic)}</li>`).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Daily Coding Challenge - learnif.</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Edu+NSW+ACT+Foundation:wght@700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Header Logo -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 680px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <span style="font-size: 30px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.5px; font-family: 'Epilogue', Arial, sans-serif;">learnif.</span>
            </td>
          </tr>
          
        </table>

        <!-- Main Content Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 680px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          
          <!-- Title -->
          <tr>
            <td style="padding: 24px 20px 12px;">
              <h1 style="margin: 0; font-size: 30px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif; line-height: 1.35;">
                ${escapeHtml(data.title)}
              </h1>
            </td>
          </tr>

          <!-- Topics List -->
          <tr>
            <td style="padding: 0 20px 12px;">
              <ul style="margin: 0; padding-left: 18px; color: rgba(255, 255, 255, 0.9); font-size: 17px; line-height: 1.75; font-family: 'Epilogue', Arial, sans-serif;">
                ${topicsHTML}
              </ul>
            </td>
          </tr>

          <!-- Read Time -->
          <tr>
            <td style="padding: 0 20px 16px;">
              <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.7); font-family: 'Epilogue', Arial, sans-serif;">
                ⏱️ ${escapeHtml(data.read_time)}
              </p>
            </td>
          </tr>

          <!-- Separator -->
          <tr>
            <td style="padding: 0 20px;">
              <div style="height: 1px; background-color: rgba(255, 255, 255, 0.15);"></div>
            </td>
          </tr>

          <!-- Questions -->
          ${questionsHTML}

          <!-- Separator -->
          <tr>
            <td style="padding: 16px 20px 0;">
              <div style="height: 1px; background-color: rgba(255, 255, 255, 0.15);"></div>
            </td>
          </tr>

          <!-- Footer Message -->
          <tr>
            <td style="padding: 20px 20px 24px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); line-height: 1.6; font-family: 'Epilogue', Arial, sans-serif; text-align: center;">
                Keep pushing your limits. Tomorrow's another challenge.
              </p>
              <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center; font-family: 'Epilogue', Arial, sans-serif;">
                Daily coding questions, complete answers, endless growth.
              </p>
            </td>
          </tr>

        </table>

        <!-- Unsubscribe Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 680px; margin: 24px auto 0;">
          <tr>
            <td style="padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.4); font-family: 'Epilogue', Arial, sans-serif;">
                You're receiving this because you subscribed to learnif.
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="font-size: 12px; color: rgba(255, 255, 255, 0.85); text-decoration: underline; font-family: 'Epilogue', Arial, sans-serif;">Unsubscribe</a>
                <span style="color: rgba(255, 255, 255, 0.3); margin: 0 8px;">•</span>
                <a href="https://learnif.16xstudios.space" style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-decoration: underline; font-family: 'Epilogue', Arial, sans-serif;">View Website</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.4); font-family: 'Epilogue', Arial, sans-serif;">
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

/**
 * Generate HTML for coding question
 */
function generateCodingQuestionHTML(question: any): string {
  const examplesHTML = question.examples.map((ex: any, idx: number) => `
    <tr>
      <td style="padding: 8px 0;">
        <strong style="color: rgba(255, 255, 255, 0.9); font-family: 'Epilogue', Arial, sans-serif;">Example ${idx + 1}:</strong>
        <div style="margin-top: 4px; font-size: 15px; color: rgba(255, 255, 255, 0.85); font-family: 'Courier New', monospace; line-height: 1.6;">
          <div>Input: <span style="color: #4CAF50;">${escapeHtml(ex.input)}</span></div>
          <div>Output: <span style="color: #4CAF50;">${escapeHtml(ex.output)}</span></div>
          <div>Explanation: ${escapeHtml(ex.explanation)}</div>
        </div>
      </td>
    </tr>
  `).join('');

  const solutionHTML = question.solution ? `
    <tr>
      <td style="padding: 20px 0;">
        <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 18px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif;">Solution</h3>
          <pre style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.95); font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(question.solution.code)}</pre>
          <div style="margin-top: 12px; font-size: 13px; color: rgba(255, 255, 255, 0.75); font-family: 'Epilogue', Arial, sans-serif;">
            <span>Time: ${question.solution.time_complexity}</span>
            <span style="margin: 0 15px;">•</span>
            <span>Space: ${question.solution.space_complexity}</span>
          </div>
        </div>
      </td>
    </tr>
  ` : '';

  const tagsHTML = question.tags.map((tag: string) => 
    `<span style="display: inline-block; padding: 4px 12px; margin: 4px 4px 4px 0; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; font-size: 12px; color: rgba(255, 255, 255, 0.7); font-family: 'Epilogue', Arial, sans-serif;">${escapeHtml(tag)}</span>`
  ).join('');

  const difficultyColors: Record<string, string> = {
    'Easy': '#4CAF50',
    'Medium': '#FF9800',
    'Hard': '#F44336'
  };
  const difficultyColor = difficultyColors[question.difficulty] || '#FFFFFF';

  return `
  <tr>
    <td style="padding: 20px 20px;">
      <!-- Question Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
        
        <!-- Question Header -->
        <tr>
          <td style="padding: 20px 20px 12px;">
            <h2 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif; line-height: 1.3;">
              ${escapeHtml(question.title)}
            </h2>
            <div style="margin-bottom: 15px;">
              <span style="display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 12px; color: ${difficultyColor}; font-weight: 600; font-family: 'Epilogue', Arial, sans-serif;">
                ${escapeHtml(question.difficulty)}
              </span>
            </div>
            <div style="margin-bottom: 15px;">
              ${tagsHTML}
            </div>
          </td>
        </tr>

        <!-- Description -->
        <tr>
          <td style="padding: 0 20px 16px;">
            <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.88); line-height: 1.7; font-family: 'Epilogue', Arial, sans-serif;">
              ${escapeHtml(question.description)}
            </p>
          </td>
        </tr>

        <!-- Examples -->
        <tr>
          <td style="padding: 0 20px 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif;">Examples</h3>
            <table role="presentation" width="100%">
              ${examplesHTML}
            </table>
          </td>
        </tr>

        <!-- Solution -->
        ${solutionHTML}

        <!-- Bottom padding -->
        <tr>
          <td style="padding: 0 25px 25px;"></td>
        </tr>

      </table>
    </td>
  </tr>
  `;
}

/**
 * Generate HTML for interview flow
 */
function generateInterviewFlowHTML(question: any): string {
  const dialogueHTML = question.dialogue.map((msg: any) => `
    <tr>
      <td style="padding: 15px 20px; ${msg.speaker === 'Interviewer' ? 'background: rgba(79, 70, 229, 0.1);' : 'background: rgba(139, 92, 246, 0.1);'}" ${msg.speaker === 'Interviewer' ? 'style="padding: 15px 20px; background: rgba(79, 70, 229, 0.1);"' : ''}>
        <div style="font-size: 13px; font-weight: 600; color: ${msg.speaker === 'Interviewer' ? '#8B9AFF' : '#A78BFA'}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Epilogue', Arial, sans-serif;">
          ${escapeHtml(msg.speaker)}
        </div>
        <div style="font-size: 15px; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-family: 'Epilogue', Arial, sans-serif;">
          ${escapeHtml(msg.message)}
        </div>
      </td>
    </tr>
  `).join('');

  const tagsHTML = question.tags.map((tag: string) => 
    `<span style="display: inline-block; padding: 4px 12px; margin: 4px 4px 4px 0; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; font-size: 12px; color: rgba(255, 255, 255, 0.7); font-family: 'Epilogue', Arial, sans-serif;">${escapeHtml(tag)}</span>`
  ).join('');

  return `
  <tr>
    <td style="padding: 20px 20px;">
      <!-- Interview Flow Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
        
        <!-- Header -->
        <tr>
          <td style="padding: 20px 20px 12px;">
            <h2 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif; line-height: 1.3;">
              ${escapeHtml(question.title)}
            </h2>
            <div style="margin-bottom: 15px;">
              ${tagsHTML}
            </div>
          </td>
        </tr>

        <!-- Description -->
        <tr>
          <td style="padding: 0 20px 16px;">
            <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.88); line-height: 1.7; font-family: 'Epilogue', Arial, sans-serif;">
              ${escapeHtml(question.description)}
            </p>
          </td>
        </tr>

        <!-- Dialogue -->
        <tr>
          <td style="padding: 0 0 25px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${dialogueHTML}
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

