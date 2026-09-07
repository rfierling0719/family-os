"use client";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GoogleCalendarButton() {
  async function connectGoogleCalendar() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        redirectTo: "https://family-os.r-fierling.workers.dev",
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    });

    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <button onClick={connectGoogleCalendar}>
      Connect Google Calendar
    </button>
  );
}
