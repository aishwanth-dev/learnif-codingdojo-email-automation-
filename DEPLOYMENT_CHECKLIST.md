# learnif. Newsletter Deployment Checklist

Follow this checklist to deploy the newsletter system.

## ✅ Pre-Deployment (Completed)

- [x] API route created (`app/api/newsletter/route.ts`)
- [x] Apps Script created (`google-apps-script.js`)
- [x] Documentation written
- [x] Build tested successfully
- [x] No TypeScript errors
- [x] Dependencies installed (googleapis)

## 🔧 Setup Steps

### 1. Google Drive Setup
- [ ] Open: https://drive.google.com/drive/folders/1gEqwJAagwwRPrhUl7L3bcrOoMkY7cxc3
- [ ] Verify service account has Editor access
- [ ] Add JSON files: day1.json, day2.json, day3.json, etc.
- [ ] Ensure JSON files follow the correct format
- [ ] Test one file manually

### 2. Google Sheets Setup
- [ ] Open your sheet: https://docs.google.com/spreadsheets/d/1V7RKKDE-RiVH_9mTIgbOTpPf9JsgQI0iY2yzRWq5-lc
- [ ] Verify columns: email, verification, learncode, date
- [ ] Add at least 5 verified test subscribers
- [ ] Ensure learncode column is empty/null
- [ ] Verify service account has edit access

### 3. Vercel Deployment
- [ ] Push code to Git
- [ ] Verify Vercel auto-deploys
- [ ] Check deployment logs
- [ ] Verify all environment variables are set:
  - [ ] GOOGLE_SHEET_ID
  - [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL
  - [ ] GOOGLE_PRIVATE_KEY
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_USER
  - [ ] SMTP_PASSWORD
  - [ ] WEBSITE_URL

### 4. Google Apps Script Setup
- [ ] Go to: https://script.google.com
- [ ] Create new project: "learnif Newsletter"
- [ ] Copy entire contents of `google-apps-script.js`
- [ ] Paste into Apps Script editor
- [ ] Update CONFIG.API_URL if needed
- [ ] Save project
- [ ] Run `setupTriggers()` function
- [ ] Authorize script when prompted
- [ ] Verify triggers created (run `listTriggers()`)

### 5. First Test
- [ ] Run `manualTest()` in Apps Script
- [ ] Check Apps Script logs for errors
- [ ] Check Vercel function logs
- [ ] Verify email received in inbox
- [ ] Check spam folder (just in case)
- [ ] Verify learncode marked as "sent" in sheet
- [ ] Verify JSON file marked as "✅done" in Drive

## 🧪 Testing Checklist

### Test Newsletter Sending
- [ ] Use `manualTest()` function
- [ ] Verify 5 emails sent (or configured batch size)
- [ ] Check all emails arrived
- [ ] Verify HTML renders correctly
- [ ] Check mobile view of email
- [ ] Verify all questions displayed
- [ ] Check code blocks formatted correctly

### Test Clear Function
- [ ] Add "sent" to some learncode cells
- [ ] Run `manualTestClear()` function
- [ ] Verify values cleared to empty
- [ ] Check logs for success message

### Test Trigger System
- [ ] Run `listTriggers()` to see all triggers
- [ ] Verify correct number of triggers (12 + 1)
- [ ] Check trigger times are correct
- [ ] Verify clear trigger at 23:59

## 📊 Monitoring Setup

### Apps Script Monitoring
- [ ] Bookmark executions page
- [ ] Set up email notifications for failures (optional)
- [ ] Check logs after first automatic run

### Vercel Monitoring
- [ ] Bookmark functions page
- [ ] Set up error alerts (optional)
- [ ] Monitor API performance

### Email Monitoring
- [ ] Check SMTP logs
- [ ] Monitor bounce rate
- [ ] Track delivery success rate

## 🚀 Go Live

### Before Going Live
- [ ] All tests passed
- [ ] At least 10 JSON files in Drive
- [ ] All subscribers verified
- [ ] Triggers configured correctly
- [ ] Monitoring in place

### Launch Day
- [ ] Wake up early (or check at 11:11 AM)
- [ ] Monitor first automatic send
- [ ] Check all emails delivered
- [ ] Verify no errors in logs
- [ ] Have celebration coffee ☕

### First Week
- [ ] Monitor every batch
- [ ] Check for delivery issues
- [ ] Review spam complaints (should be 0)
- [ ] Verify JSON cycling properly
- [ ] Check night reset working

## 🆘 Troubleshooting

If something goes wrong:

1. **Check Logs First**
   - Apps Script: Executions tab
   - Vercel: Functions logs

2. **Common Issues**
   - Missing env vars → Check Vercel settings
   - No emails to send → Verify subscribers added
   - Drive access denied → Check permissions
   - SMTP errors → Verify credentials

3. **Emergency Stop**
   - Run `deleteAllTriggers()` in Apps Script
   - System stops immediately

4. **Restart Fresh**
   - Clear all learncode values manually
   - Remove "✅done" from Drive files
   - Run `setupTriggers()` again

## 📝 Daily Maintenance

- [ ] Add new JSON files as needed
- [ ] Monitor execution logs
- [ ] Check for errors
- [ ] Verify delivery stats
- [ ] Review subscriber growth

## 🎉 Success Criteria

You're successful when:
- ✅ Emails send automatically every hour
- ✅ All emails arrive in inbox (not spam)
- ✅ Beautiful HTML renders perfectly
- ✅ JSON files cycle through daily
- ✅ Reset happens at 11:59 PM
- ✅ No manual intervention needed
- ✅ Zero errors in logs

---

## 📞 Need Help?

- Quick Start: See `QUICK_START.md`
- Full Guide: See `NEWSLETTER_SETUP.md`
- Summary: See `NEWSLETTER_SYSTEM_SUMMARY.md`
- Logs: Check Apps Script and Vercel

**Good luck! You've got this! 🚀**

