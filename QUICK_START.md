# learnif. Newsletter - Quick Start Guide 🚀

## ⚡ 5-Minute Setup

### Step 1: Add JSON Files to Drive
```
https://drive.google.com/drive/folders/1gEqwJAagwwRPrhUl7L3bcrOoMkY7cxc3

Add files: day1.json, day2.json, day3.json, etc.
```

### Step 2: Set Up Google Apps Script
1. Go to https://script.google.com
2. Click **New Project**
3. Copy contents from `google-apps-script.js`
4. Paste into editor
5. Save project

### Step 3: Configure Triggers
1. In Apps Script, click **Run** → Select `setupTriggers`
2. Click the **Run** button (▶)
3. Authorize the script
4. Done! ✅

### Step 4: Test It
1. Run `manualTest()` in Apps Script
2. Check your email
3. Check Apps Script logs

## 📝 Google Sheet Structure

Your sheet must have these columns (in any order):
```
email          | verification | learncode | date
user@mail.com  | verified     |           | 2024-01-01
user2@mail.com | verified     |           | 2024-01-01
```

## ✅ Done!

The system will now:
- 📧 Send newsletters every hour starting at 11:11 AM
- 🗑️ Clear "sent" status at 11:59 PM daily
- 🔄 Automatically loop through day1, day2, day3, etc.

## 🧪 Testing

### Test Newsletter Send:
```javascript
// In Apps Script, run:
manualTest()
```

### Test Clear Function:
```javascript
// In Apps Script, run:
manualTestClear()
```

### List Triggers:
```javascript
// In Apps Script, run:
listTriggers()
```

## 📊 Monitoring

Check execution logs:
1. Apps Script → **Executions** tab
2. Click on any execution
3. View logs

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "No emails to send" | Add verified users or clear learncode values |
| "No newsletter data" | Add JSON files to Drive folder |
| "API error" | Check Vercel deployment status |
| Emails not arriving | Check spam, verify SMTP config |

## 📞 Need Help?

See `NEWSLETTER_SETUP.md` for detailed instructions.

---

**Ready to go! 🎉**

