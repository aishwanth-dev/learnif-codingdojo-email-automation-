# learnif. Newsletter Automation Setup Guide

Complete guide to set up the automated newsletter system that sends daily coding challenges to your subscribers.

## 📋 Overview

This system automatically:
- ✅ Sends newsletters every hour starting from 11:11 AM
- ✅ Sends to batches of 45 subscribers per hour
- ✅ Fetches content from Google Drive (day1.json, day2.json, etc.)
- ✅ Marks files as "✅done" after sending
- ✅ Clears all "sent" statuses at 11:59 PM daily
- ✅ Uses beautiful HTML email templates matching your website theme

## 🚀 Setup Steps

### 1. Google Drive Setup

1. **Ensure your Drive folder is accessible:**
   - URL: https://drive.google.com/drive/folders/1gEqwJAagwwRPrhUl7L3bcrOoMkY7cxc3
   - Make sure your service account has Editor access (as mentioned, bot is already enabled as editor)
   - Add JSON files: day1.json, day2.json, day3.json, etc.

2. **JSON File Format:**
   ```json
   {
     "title": "Today we will cover:",
     "topics": [
       "Find Maximum Element in Array",
       "Reverse Array In Place",
       "Interview Flow: Array Operations in C"
     ],
     "read_time": "Under 8 minutes",
     "questions": [
       {
         "type": "coding",
         "title": "Find Maximum Element in Array",
         "difficulty": "Easy",
         "tags": ["Array", "C Programming", "Google"],
         "description": "Given an array of integers, find and return the maximum element...",
         "examples": [
           {
             "input": "arr = [12, 45, 7, 89, 32], n = 5",
             "output": "89",
             "explanation": "89 is the largest element in the array."
           }
         ],
         "solution": {
           "language": "c",
           "code": "#include <stdio.h>...",
           "time_complexity": "O(n)",
           "space_complexity": "O(1)"
         }
       }
     ]
   }
   ```

3. **Marking files as done:**
   - The system automatically marks files as "✅done" in the file description
   - Don't manually add "✅done" to file names or descriptions

### 2. Google Sheets Setup

1. **Ensure your sheet has these columns:**
   - `email` - Subscriber email addresses
   - `verification` - Should be "verified" for active subscribers
   - `learncode` - Left empty initially, will be marked "sent" after sending
   - `date` - (Optional) Subscription date

2. **Sample sheet structure:**
   ```
   | email              | verification | learncode | date                |
   |--------------------|--------------|-----------|---------------------|
   | user@example.com   | verified     |           | 2024-01-01T10:00:00 |
   | user2@example.com  | verified     |           | 2024-01-01T10:00:00 |
   ```

### 3. Environment Variables

Make sure these are set in Vercel (or your hosting platform):

```env
# Google Sheets
GOOGLE_SHEET_ID=1V7RKKDE-RiVH_9mTIgbOTpPf9JsgQI0iY2yzRWq5-lc
GOOGLE_SERVICE_ACCOUNT_EMAIL=learnif-sheets@learnif.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# SMTP Email
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_USER=no-reply@16xstudios.space
SMTP_PASSWORD=your_password

# Website
WEBSITE_URL=https://learnif.16xstudios.space
```

### 4. Google Apps Script Setup

1. **Open Google Apps Script:**
   - Go to https://script.google.com
   - Create a new project

2. **Copy the script:**
   - Open the `google-apps-script.js` file from this project
   - Copy all contents
   - Paste into the Google Apps Script editor

3. **Configure the script:**
   - Update `CONFIG.API_URL` if your website URL is different
   - Update `CONFIG.SPREADSHEET_ID` if needed
   - Adjust `CONFIG.BATCH_SIZE` if you want different batch sizes

4. **Set up triggers:**
   - In the Apps Script editor, run the `setupTriggers()` function
   - Go to **Run** → **Run function** → `setupTriggers`
   - Authorize the script when prompted

5. **Verify triggers:**
   - Run `listTriggers()` to see all configured triggers
   - You should see:
     - Multiple `sendNewsletterBatch` triggers (one for each hour)
     - One `clearLearncodeColumn` trigger for 23:59

### 5. Testing

1. **Manual test:**
   - Run `manualTest()` in Apps Script
   - Check logs for successful execution
   - Verify emails are received

2. **Clear test:**
   - Add some "sent" values to your sheet
   - Run `manualTestClear()` in Apps Script
   - Verify values are cleared

3. **Test API directly:**
   ```bash
   curl -X POST https://learnif.16xstudios.space/api/newsletter \
     -H "Content-Type: application/json" \
     -d '{"batchSize": 5}'
   ```

## 📅 Schedule

### Newsletter Sending Times:
- 11:11 AM - First batch of 45 emails
- 12:12 PM - Second batch of 45 emails
- 01:13 PM - Third batch of 45 emails
- ...continues every hour until 10:11 PM

### Reset Schedule:
- 11:59 PM - All "sent" values cleared

## 🔍 Monitoring

1. **Google Apps Script Logs:**
   - Open Apps Script editor
   - Go to **Executions** tab
   - View logs for each run

2. **API Logs:**
   - Check Vercel function logs
   - Go to your project → **Deployments** → Click on deployment → **Functions**

3. **Email Verification:**
   - Check your SMTP logs
   - Verify emails are not going to spam
   - Test with your own email

## 🛠️ Troubleshooting

### Emails not sending:
1. Check Apps Script executions for errors
2. Verify API is accessible (test with curl)
3. Check SMTP credentials
4. Verify Google Drive folder access

### "No emails to send" error:
1. Check if learncode column is properly cleared
2. Verify emails have "verified" status
3. Check if there are null/empty learncode values

### "No newsletter data found":
1. Verify Google Drive folder has JSON files
2. Check if service account has access
3. Ensure files don't have "✅done" in description yet

### Triggers not running:
1. Run `listTriggers()` to verify triggers exist
2. Check trigger time zones
3. Verify Apps Script authorization

## 📧 Email Template Features

- ✅ Glassmorphism design matching your website
- ✅ Responsive layout (mobile-friendly)
- ✅ Epilogue and Edu NSW ACT Cursive fonts
- ✅ Syntax highlighting for code blocks
- ✅ Beautiful color-coded difficulty badges
- ✅ Company tags for each question
- ✅ Interview simulation dialogues
- ✅ Anti-spam best practices
- ✅ Unsubscribe link placeholder

## 🔐 Security Best Practices

1. **Keep API URL secure** - Don't expose it publicly
2. **Rotate SMTP password** regularly
3. **Limit Drive folder access** to necessary accounts only
4. **Monitor logs** for suspicious activity
5. **Rate limiting** - Consider implementing if needed

## 📊 Advanced Configuration

### Change batch size:
Edit `CONFIG.BATCH_SIZE` in Apps Script

### Add more sending hours:
Edit the `hours` array in `setupTriggers()` function

### Customize email template:
Edit `generateNewsletterHTML()` function in `app/api/newsletter/route.ts`

### Change Drive folder:
Update `driveFolderId` in `app/api/newsletter/route.ts`

## 🆘 Support

If you encounter issues:
1. Check the logs carefully
2. Verify all credentials and IDs
3. Test each component individually
4. Review the error messages

## ✅ Checklist

Before going live:
- [ ] Google Drive folder has JSON files
- [ ] Service account has Editor access to Drive
- [ ] Google Sheet has correct columns
- [ ] Environment variables set in Vercel
- [ ] Apps Script triggers configured
- [ ] Tested with manualTest()
- [ ] Tested with manualTestClear()
- [ ] Verified emails received
- [ ] Checked spam folder
- [ ] Monitored logs for 24 hours

---

**Happy Coding! 🚀**

Your automated newsletter system is now ready to keep your subscribers engaged with daily coding challenges!

