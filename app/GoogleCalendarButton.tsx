"use client";

import { useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wotovotafnfxgljbigju.supabase.co",
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J"
);

export default function GoogleCalendarButton() {
  const [status, setStatus] = useState("Checking connection...");

  async function saveGoogleToken(session: Session) {
    if (!session.provider_refresh_token) {
      return false;
    }

    try {
      const response = await fetch("/api/google/store-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          refresh_token: session.provider_refresh_token
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Unable to save Google token:", result);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Unable to save Google token:", error);
      return false;
    }
  }

  async function handleSession(session: Session | null) {
    if (!session) {
      setStatus("Not connected");
      return;
    }

    if (!session.provider_token) {
      setStatus("Signed in, but no Google Calendar token found");
      return;
    }

    if (!session.provider_refresh_token) {
      setStatus("Connected, but no refresh token received");
      return;
    }

    setStatus("Saving Google Calendar connection...");

    const saved = await saveGoogleToken(session);

    if (saved) {
      setStatus("Google Calendar connected ✓");
    } else {
      setStatus("Calendar connected, but token could not be saved");
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      await handleSession(data.session);
    };

    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function connectGoogleCalendar() {
    setStatus("Connecting...");

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
      setStatus("Connection failed");
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
