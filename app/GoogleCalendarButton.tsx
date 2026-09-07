"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wotovotafnfxgljbigju.supabase.co",
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J"
);

export default function GoogleCalendarButton() {
  const [status, setStatus] = useState("Not connected");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setStatus("Not connected");
        return;
      }

      if (session.provider_token && session.provider_refresh_token) {
        setStatus("Google Calendar connected ✓");
      } else if (session.provider_token) {
        setStatus("Connected, but no refresh token received");
      } else {
        setStatus("Signed in, but no Google Calendar token found");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus("Not connected");
        return;
      }

      if (session.provider_token && session.provider_refresh_token) {
        setStatus("Google Calendar connected ✓");
      } else if (session.provider_token) {
        setStatus("Connected, but no refresh token received");
      } else {
        setStatus("Signed in, but no Google Calendar token found");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function connectGoogleCalendar() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        redirectTo: "https://family-os.r-fierling.workers.dev",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <button className="btn" onClick={connectGoogleCalendar}>
        Connect Google Calendar
      </button>

      <p style={{ marginTop: "8px", fontSize: "14px" }}>
        {status}
      </p>
    </div>
  );
}
