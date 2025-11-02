# Google Sheets Setup Guide

Follow these steps to connect your website to Google Sheets for email collection:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API** for your project

## Step 2: Create a Service Account

1. Navigate to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "learnif-sheets")
4. Click **Create and Continue**
5. Skip role assignment and click **Done**

## Step 3: Create and Download Credentials

1. Click on your newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the JSON file

## Step 4: Get Your Credentials

Open the downloaded JSON file. You'll need:
- `client_email` - This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` - This is your `GOOGLE_PRIVATE_KEY`

## Step 5: Create a Google Sheet

1. Create a new Google Sheet
2. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
3. Share the sheet with the service account email (from Step 4)
   - Give it **Editor** permissions

## Step 6: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` must include the `\n` characters (newlines)
- Keep the quotes around the private key value
- Never commit `.env.local` to version control

## Step 7: Test

Run your development server and test the email submission. Check your Google Sheet to see if the email was added!

