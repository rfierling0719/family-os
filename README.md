# Family OS — Cloudflare Ready

This package is prepared for deployment to Cloudflare Workers using OpenNext.

## Cloudflare dashboard settings
- Root directory: `/`
- Build command: `npm run cf:build`
- Deploy command: `npx wrangler deploy`

## Environment variables
Add these in Cloudflare Worker → Settings → Variables and Secrets:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET (Secret)
- GOOGLE_REDIRECT_URI
- GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.events

Do not commit Google or Supabase secrets to GitHub.

## Google redirect URI
After the first successful deployment, use:
https://YOUR-WORKER.workers.dev/api/google/auth/callback
as both GOOGLE_REDIRECT_URI and an Authorized redirect URI in Google Cloud.
