"use client";

import { useEffect, useState } from "react";
import { createClient, Session } from "@supabase/supabase-js";

const supabaseUrl = "https://wotovotafnfxgljbigju.supabase.co";

const supabaseAnonKey =
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J";

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

type CalendarEvent = {
  id: string;
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  } | null;
  end?: {
    dateTime?: string;
    date?: string;
  } | null;
  location?: string | null;
};

export default function GoogleCalendarButton() {
  const [status, setStatus] = useState("Checking connection...");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  async function saveGoogleRefreshToken(session: Session) {
    if (!session.provider_refresh_token) {
      return true;
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
        console.error(
          "Unable to save Google refresh token:",
          result
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Unable to save Google refresh token:",
        error
      );
      return false;
    }
  }

  async function loadCalendarEvents(session: Session) {
    setLoadingEvents(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/google-calendar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey,
            "Content-Type": "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error(
          "Calendar Edge Function error:",
          result
        );

        if (response.status === 401) {
          setStatus(
            "Google Calendar authorization needs to be refreshed"
          );
        } else if (response.status === 404) {
          setStatus(
            "Google Calendar needs to be connected"
          );
        } else {
          setStatus(
            "Connected, but calendar events could not be loaded"
          );
        }

        setEvents([]);
        return;
      }

      setEvents(result.events || []);
      setStatus("Google Calendar connected ✓");
    } catch (error) {
      console.error(
        "Unable to load calendar events:",
        error
      );

      setStatus(
        "Connected, but calendar events could not be loaded"
      );

      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleSession(
    session: Session | null
  ) {
    if (!session) {
      setStatus("Not connected");
      setEvents([]);
      return;
    }

    if (session.provider_refresh_token) {
      setStatus(
        "Saving Google Calendar connection..."
      );

      const saved =
        await saveGoogleRefreshToken(session);

      if (!saved) {
        setStatus(
          "Calendar connected, but token could not be saved"
        );
        return;
      }
    }

    setStatus("Loading Google Calendar...");

    await loadCalendarEvents(session);
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error(
          "Unable to read Supabase session:",
          error
        );
        setStatus("Unable to check connection");
        return;
      }

      await handleSession(data.session);
    };

    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function connectGoogleCalendar() {
    setStatus("Connecting...");

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes:
            "https://www.googleapis.com/auth/calendar.events",
          redirectTo:
            "https://family-os.r-fierling.workers.dev",
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });

    if (error) {
      console.error(
        "Google connection error:",
        error
      );

      setStatus("Connection failed");
      alert(error.message);
    }
  }

  function formatEventDate(
    event: CalendarEvent
  ) {
    const value =
      event.start?.dateTime ||
      event.start?.date;

    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (event.start?.dateTime) {
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  }

  return (
    <div>
      <button
        className="btn"
        onClick={connectGoogleCalendar}
      >
        Connect Google Calendar
      </button>

      <p
        style={{
          marginTop: "8px",
          fontSize: "14px"
        }}
      >
        {status}
      </p>

      {loadingEvents && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "14px"
          }}
        >
          Loading upcoming events...
        </p>
      )}

      {!loadingEvents &&
        events.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <strong>Upcoming events</strong>

            <ul
              style={{
                marginTop: "8px",
                paddingLeft: "20px"
              }}
            >
              {events.map((event) => (
                <li
                  key={event.id}
                  style={{
                    marginBottom: "8px"
                  }}
                >
                  <strong>
                    {event.summary ||
                      "Untitled event"}
                  </strong>

                  <br />

                  <span
                    style={{
                      fontSize: "13px"
                    }}
                  >
                    {formatEventDate(event)}
                  </span>

                  {event.location && (
                    <>
                      <br />
                      <span
                        style={{
                          fontSize: "13px"
                        }}
                      >
                        📍 {event.location}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      {!loadingEvents &&
        status ===
          "Google Calendar connected ✓" &&
        events.length === 0 && (
          <p
            style={{
              marginTop: "8px",
              fontSize: "14px"
            }}
          >
            No upcoming events found.
          </p>
        )}
    </div>
  );
}
