Vercel Deployment Guide
=======================

Follow these steps to deploy this Next.js project to Vercel and securely provide Google Sheets credentials.

1) Remove local service-account file from the repo (recommended)
   - The file `google-sheets-credentials.json` contains sensitive keys. Remove it from the repo and keep it locally.
     ```bash
     git rm --cached google-sheets-credentials.json || true
     ```

2) Required environment variables
   - Set the following environment variables in the Vercel dashboard (Project Settings → Environment Variables) or via the Vercel CLI:
     - `GOOGLE_CLIENT_EMAIL` — the `client_email` value from the service account JSON
     - `GOOGLE_PRIVATE_KEY` — the `private_key` value from the JSON, stored as a single-line string with `\n` for newlines
     - `GOOGLE_SHEET_ID` — the spreadsheet ID (the long id in the sheet URL)

   Example formatting for `GOOGLE_PRIVATE_KEY` (replace newlines with `\n`):

   ```text
   -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n
   ```

   Note: The API code in `src/app/api/sheet/route.js` already converts escaped `\n` sequences back to newlines when running on Vercel.

3) Add env vars using Vercel CLI (optional)
   - Install and log in:
     ```bash
     npm i -g vercel
     vercel login
     ```
   - Add variables (the CLI will prompt for values):
     ```bash
     vercel env add GOOGLE_CLIENT_EMAIL production
     vercel env add GOOGLE_PRIVATE_KEY production
     vercel env add GOOGLE_SHEET_ID production
     ```

   - If you prefer creating a secret for the key, you can add the private key as a Vercel secret and reference it in the dashboard:
     ```bash
     vercel secrets add google-sheet-key "$(cat path/to/google-sheets-credentials.json | jq -r .private_key | sed ':a;N;$!ba;s/\n/\\n/g')"
     ```

4) Deploy
   - Using the Vercel CLI (interactive):
     ```bash
     vercel --prod
     ```
   - Or connect the Git repository to Vercel (preferred for continuous deploys):
     - Push your branch to GitHub, GitLab, or Bitbucket
     - In Vercel dashboard click "New Project" → import your repo → set the environment variables during setup

5) Runtime notes
   - This project uses server-side Next.js API routes in `src/app/api/*`, which run on Vercel serverless functions.
   - Ensure the environment variables are set for all environments you use (Preview, Production).

6) Troubleshooting
   - If you see authentication errors, verify `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` exactly match the service account JSON values.
   - Ensure the service account has access to the spreadsheet (Share the sheet with the `client_email`).

If you'd like, I can: add `.gitignore` entries, remove the credentials file from git history, or set up Vercel project environment values via the CLI for you.
