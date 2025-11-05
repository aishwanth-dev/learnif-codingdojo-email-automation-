import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
// Render code as PNG for reliable formatting in email clients
// Lightweight dependency; if unavailable at runtime, we gracefully fall back to <pre> blocks
let Canvas: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Canvas = require('canvas');
} catch (_) {
  Canvas = null;
}

// Mark route as dynamic
export const dynamic = 'force-dynamic';

interface NewsletterData {
  title: string;
  topics: string[];
  read_time: string;
  questions: any[];
}

interface DriveNewsletterPayload {
  data: NewsletterData;
  fileId: string;
  fileDescription: string;
  fileName: string;
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

    // Get newsletter JSON from Drive (do not mark done yet)
    const drivePayload = await getNewsletterFromDrive(jwt, driveFolderId);
    if (!drivePayload) {
      return NextResponse.json(
        { error: 'No newsletter data found' },
        { status: 404 }
      );
    }
    const newsletterData = drivePayload.data;
    console.log('[NEWSLETTER] ✓ Newsletter data fetched from Drive:', drivePayload.fileName);

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
    
    // Prepare images for solutions (render code as PNG and embed)
    await attachSolutionImages(newsletterData);

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

    // Mark the processed Drive file as done AFTER sending loop runs
    try {
      await markDriveFileAsDone(jwt, drivePayload.fileId, drivePayload.fileDescription);
      console.log(`[DRIVE] ✓ Marked ${drivePayload.fileName} as done`);
    } catch (e) {
      console.error('[DRIVE] ✗ Failed to mark file as done:', e);
    }

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
async function getNewsletterFromDrive(jwt: JWT, folderId: string): Promise<DriveNewsletterPayload | null> {
  try {
    console.log('[DRIVE] Fetching newsletter from Drive folder:', folderId);
    
    const drive = google.drive({ version: 'v3', auth: jwt });
    
    // List all files in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      orderBy: 'name asc',
      fields: 'files(id, name, createdTime)',
    });

    const files = response.data.files || [];
    console.log('[DRIVE] Found JSON files:', files.map(f => f.name));

    // Prefer files named as dayN.json in ascending order
    const dayFiles = files
      .filter(f => (f.name || '').toLowerCase().match(/^day\d+\.json/))
      .sort((a, b) => {
        const an = parseInt(((a.name || '').match(/\d+/) || ['0'])[0], 10);
        const bn = parseInt(((b.name || '').match(/\d+/) || ['0'])[0], 10);
        return an - bn;
      });

    const pickList = dayFiles.length ? dayFiles : files;

    // Find the first JSON file without "✅done" in the description or name
    for (const file of pickList) {
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

      // Do not mark done here; return payload so caller can mark after sending
      return { data: newsletterData, fileId: file.id, fileDescription: description, fileName: file.name };
    }

    console.log('[DRIVE] No unprocessed newsletter files found');
    return null;
  } catch (error) {
    console.error('[DRIVE] ✗ Error fetching from Drive:', error);
    throw error;
  }
}

async function markDriveFileAsDone(jwt: JWT, fileId: string, existingDescription: string) {
  const drive = google.drive({ version: 'v3', auth: jwt });
  await drive.files.update({
    fileId,
    requestBody: {
      description: existingDescription ? `${existingDescription}\n✅done` : '✅done'
    }
  });
}

/**
 * Send newsletter email
 */
async function sendNewsletterEmail(email: string, htmlContent: string) {
  const smtpHost = process.env.SMTP_HOST || 'mail.privateemail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER || 'no-reply@16xstudios.space';
  const smtpPassword = process.env.SMTP_PASSWORD || '';

  if (!smtpPassword) {
    throw new Error('SMTP_PASSWORD is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const unsubscribeMatch = htmlContent.match(/href=\"(https?:\/\/[^\"]+unsubscribe[^\"]*)\"/);
  const unsubscribeUrl = unsubscribeMatch ? unsubscribeMatch[1] : undefined;

  const mailOptions: any = {
    from: `"learnif." <${smtpUser}>`,
    to: email,
    subject: 'Daily Coding Challenge from learnif.',
    html: htmlContent,
    text: 'Your daily coding challenge. View in HTML for full formatting.',
    ...(unsubscribeUrl ? { list: { unsubscribe: unsubscribeUrl } } : {})
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
      <td align="center" style="padding: 16px 12px;">
        
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
          <td style="padding: 20px 16px 10px;">
              <h1 style="margin: 0; font-size: 30px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif; line-height: 1.35;">
                ${escapeHtml(data.title)}
              </h1>
            </td>
          </tr>

          <!-- Topics List -->
          <tr>
            <td style="padding: 0 16px 10px;">
              <ul style="margin: 0; padding-left: 18px; color: rgba(255, 255, 255, 0.92); font-size: 18px; line-height: 1.6; font-family: 'Epilogue', Arial, sans-serif;">
                ${topicsHTML}
              </ul>
            </td>
          </tr>

          <!-- Read Time -->
          <tr>
            <td style="padding: 0 16px 12px;">
              <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.75); font-family: 'Epilogue', Arial, sans-serif;">
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
            <td style="padding: 14px 16px 0;">
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
        <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FFFFFF; font-family: 'Epilogue', Arial, sans-serif;">Solution</h3>
          ${question.solution_image_base64 ? `<img src="data:image/png;base64,${question.solution_image_base64}" alt="Solution" style="display:block; width:100%; height:auto; border-radius: 8px;"/>` : `<pre style=\"margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.95); font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;\">${escapeHtml(question?.solution?.code ?? '')}</pre>`}
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
            <td style="padding: 16px 16px;">
      <!-- Question Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
        
        <!-- Question Header -->
        <tr>
          <td style="padding: 16px 16px 10px;">
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
          <td style="padding: 0 16px 12px;">
            <p style="margin: 0; font-size: 17px; color: rgba(255, 255, 255, 0.9); line-height: 1.6; font-family: 'Epilogue', Arial, sans-serif;">
              ${escapeHtml(question.description)}
            </p>
          </td>
        </tr>

        <!-- Examples -->
        <tr>
          <td style="padding: 0 16px 12px;">
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
          <td style="padding: 0 18px 18px;"></td>
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
      <td style="padding: 15px 20px; ${msg.speaker === 'Interviewer' ? 'background: rgba(79, 70, 229, 0.1);' : 'background: rgba(139, 92, 246, 0.1);'}">
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
  const value = text == null ? '' : String(text);
  return value.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Pre-render solution code blocks to PNG data URLs and attach to questions as `solution_image_base64`.
 * Falls back silently if the canvas dependency is not available at runtime.
 */
async function attachSolutionImages(data: NewsletterData) {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Epilogue-Regular.ttf');
  try {
    if (Canvas && fs.existsSync(fontPath)) {
      // Register once; ignore if already registered
      try { Canvas.registerFont(fontPath, { family: 'EpilogueEmail' }); } catch (_) {}
    }
  } catch (_) {}

  const promises: Promise<void>[] = [];
  for (const q of data.questions) {
    if (q?.type === 'coding' && q?.solution?.code) {
      promises.push(
        (async () => {
          try {
            // Prefer Puppeteer for highest fidelity; fallback to Canvas; then HTML <pre>
            let base64: string | null = await renderCodeToPngWithPuppeteer(String(q.solution.code));
            if (!base64 && Canvas) {
              base64 = await renderCodeToPng(String(q.solution.code));
            }
            if (base64) {
              q.solution_image_base64 = base64;
            }
          } catch (_) {}
        })()
      );
    }
  }
  await Promise.all(promises);
}

async function renderCodeToPng(code: string): Promise<string | null> {
  if (!Canvas) return null;
  const padding = 32;
  const maxWidth = 1200;
  const maxHeight = 2200;
  const lineHeight = 28;
  const fontSize = 18;
  const background = '#0b1020';
  const card = '#0f1b3d';
  const textColor = '#e6f0ff';

  // Create a measuring context
  const measureCanvas = Canvas.createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${fontSize}px EpilogueEmail, monospace`;

  const rawLines = code.replace(/\r\n/g, '\n').split('\n');

  // Helper: wrap an individual line to fit content width, preferring to break on spaces
  const contentMaxWidth = maxWidth - padding * 2;
  const wrappedLines: string[] = [];
  for (const rawLine of rawLines) {
    let line = rawLine;
    while (measureCtx.measureText(line).width > contentMaxWidth) {
      let breakIndex = line.lastIndexOf(' ', Math.floor(line.length * (contentMaxWidth / measureCtx.measureText(line).width)));
      if (breakIndex <= 0) breakIndex = Math.floor(line.length * (contentMaxWidth / measureCtx.measureText(line).width));
      wrappedLines.push(line.slice(0, breakIndex));
      line = line.slice(breakIndex).trimStart();
    }
    wrappedLines.push(line);
  }

  // Compute dynamic canvas width based on longest wrapped line (clamped)
  const longestWidth = wrappedLines.reduce((w, l) => Math.max(w, measureCtx.measureText(l).width), 0);
  const canvasWidth = Math.min(maxWidth, Math.ceil(longestWidth + padding * 2));
  const contentWidth = canvasWidth - padding * 2;

  // Re-wrap if canvasWidth shrunk
  const finalLines: string[] = [];
  for (const l of wrappedLines) {
    let s = l;
    while (measureCtx.measureText(s).width > contentWidth) {
      let i = s.lastIndexOf(' ', Math.floor(s.length * (contentWidth / measureCtx.measureText(s).width)));
      if (i <= 0) i = Math.floor(s.length * (contentWidth / measureCtx.measureText(s).width));
      finalLines.push(s.slice(0, i));
      s = s.slice(i).trimStart();
    }
    finalLines.push(s);
  }

  const canvasHeight = Math.min(maxHeight, padding * 2 + Math.max(finalLines.length, 1) * lineHeight + 20);
  const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Card
  ctx.fillStyle = card;
  ctx.fillRect(padding / 2, padding / 2, canvasWidth - padding, canvasHeight - padding);

  // Text
  ctx.font = `${fontSize}px EpilogueEmail, monospace`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  let y = padding;
  for (const line of finalLines) {
    if (y > canvasHeight - padding) break;
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }

  return canvas.toBuffer('image/png').toString('base64');
}

// High-fidelity renderer using headless Chrome. Works even when Canvas native module is not available.
async function renderCodeToPngWithPuppeteer(code: string): Promise<string | null> {
  // Prefer Vercel-friendly stack: puppeteer-core + @sparticuz/chromium
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const chromium = require('@sparticuz/chromium');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ppc = require('puppeteer-core');

    const executablePath = await chromium.executablePath();
    const browser = await ppc.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; background: #0b1020; }
          .card { margin: 16px; background: #0f1b3d; border-radius: 12px; padding: 24px; }
          pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 16px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: #e6f0ff; }
          code { font: inherit; color: inherit; }
        </style>
      </head>
      <body>
        <div class="card"><pre><code>${escapeHtml(code)}</code></pre></div>
      </body>
      </html>`;
    await page.setViewport({ width: 1200, height: 10, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const card = await page.$('.card');
    const buffer: Buffer = await card!.screenshot({ type: 'png' });
    await browser.close();
    return buffer.toString('base64');
  } catch (_) {
    // Fallback to full puppeteer (local dev machines)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      const html = `<!doctype html>
        <html>
        <head>
          <meta charset=\"utf-8\" />
          <style>
            body { margin: 0; background: #0b1020; }
            .card { margin: 16px; background: #0f1b3d; border-radius: 12px; padding: 24px; }
            pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 16px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: #e6f0ff; }
            code { font: inherit; color: inherit; }
          </style>
        </head>
        <body>
          <div class=\"card\"><pre><code>${escapeHtml(code)}</code></pre></div>
        </body>
        </html>`;
      await page.setViewport({ width: 1200, height: 10, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const card = await page.$('.card');
      const buffer: Buffer = await card!.screenshot({ type: 'png' });
      await browser.close();
      return buffer.toString('base64');
    } catch (_) {
      return null;
    }
  }
}

