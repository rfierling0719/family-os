"use client";

import { useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wotovotafnfxgljbigju.supabase.co",
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J"
);

type CalendarEvent = {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
};

export default function GoogleCalendarButton() {
  const [status, setStatus] = useState("Checking connection...");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

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

  async function loadCalendarEvents(providerToken: string) {
    setLoadingEvents(true);

    try {
      const now = new Date().toISOString();

      const url = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      );

      url.searchParams.set("timeMin", now);
      url.searchParams.set("maxResults", "8");
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${providerToken}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Google Calendar error:", result);
        setStatus("Connected, but calendar events could not be loaded");
        return;
      }

      setEvents(result.items || []);
    } catch (error) {
      console.error("Unable to load calendar events:", error);
      setStatus("Connected, but calendar events could not be loaded");
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleSession(session: Session | null) {
    if (!session) {
      setStatus("Not connected");
      setEvents([]);
      return;
    }

    if (!session.provider_token) {
      setStatus("Signed in, but no Google Calendar token found");
      setEvents([]);
      return;
    }

    if (session.provider_refresh_token) {
      setStatus("Saving Google Calendar connection...");

      const saved = await saveGoogleToken(session);

      if (saved) {
        setStatus("Google Calendar connected ✓");
      } else {
        setStatus("Calendar connected, but token could not be saved");
      }
    } else {
      setStatus("Google Calendar connected ✓");
    }

    await loadCalendarEvents(session.provider_token);
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

  function formatEventDate(event: CalendarEvent) {
    const value = event.start?.dateTime || event.start?.date;

    if (!value) {
      return "";
    }

    const date = new Date(value);

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: event.start?.dateTime ? "numeric" : undefined,
      minute: event.start?.dateTime ? "2-digit" : undefined
    });
  }

  return (
    <div>
      <button className="btn" onClick={connectGoogleCalendar}>
        Connect Google Calendar
      </button>

      <p style={{ marginTop: "8px", fontSize: "14px" }}>
        {status}
      </p>

      {loadingEvents && (
        <p style={{ marginTop: "8px", fontSize: "14px" }}>
          Loading upcoming events...
        </p>
      )}

      {!loadingEvents && events.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <strong>Upcoming events</strong>

          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
            {events.map((event) => (
              <li key={event.id} style={{ marginBottom: "6px" }}>
                <strong>{event.summary || "Untitled event"}</strong>
                <br />
                <span style={{ fontSize: "13px" }}>
                  {formatEventDate(event)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loadingEvents &&
        status.includes("connected") &&
        events.length === 0 && (
          <p style={{ marginTop: "8px", fontSize: "14px" }}>
            No upcoming events found.
          </p>
        )}
    </div>
  );
}
