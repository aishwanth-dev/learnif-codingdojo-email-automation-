# learnif.

A beautiful email newsletter signup page with glassmorphism design and Framer Motion animations.

## Features

- ✨ Glassmorphism design matching the reference image
- 🎨 Smooth Framer Motion animations
- 📧 Google Sheets integration for email collection
- 📱 Fully responsive design
- 🎯 Custom fonts (Edu NSW ACT Cursive & Epilogue)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Google Sheets API:
   - See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed instructions
   - Or quickly:
     - Create a Google Cloud project and enable Google Sheets API
     - Create a service account and download credentials
     - Share your Google Sheet with the service account email
     - Add environment variables to `.env.local`

3. Make sure `image/images.jpg` exists in the `public` directory

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Environment Variables

Create a `.env.local` file with:
- `GOOGLE_SHEET_ID`: Your Google Sheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email
- `GOOGLE_PRIVATE_KEY`: Service account private key (with `\n` for newlines)

