# Family OS Cloud v1

Deployable Next.js/Supabase starter with Google Calendar OAuth and event creation.

## Google Calendar
Google supports OAuth and the Calendar API for listing calendars/events and creating events. The starter uses the narrower `calendar.events` scope by default. Production should persist encrypted refresh tokens server-side and use Supabase Auth/RLS.

## Deployment
1. Create a Supabase project and run `supabase/schema.sql`.
2. Create a Google Cloud OAuth Web Application, enable Google Calendar API, and set the redirect URI to your deployed `/api/google/auth/callback`.
3. Add `.env.local` values from `.env.example`.
4. Deploy to Vercel or another Node-compatible host.
5. Finish Supabase Auth, household membership/RLS, encrypted token storage, calendar read/sync, and the remaining CRUD screens before using it for important household records.

Never commit `.env.local`, OAuth secrets, or refresh tokens.
