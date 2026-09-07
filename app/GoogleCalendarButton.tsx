"use client";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wotovotafnfxgljbigju.supabase.co",
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J"
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
    <button className="btn" onClick={connectGoogleCalendar}>
      Connect Google Calendar
    </button>
  );
}
