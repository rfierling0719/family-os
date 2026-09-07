"use client";

import {
  useEffect,
  useState
} from "react";

import {
  createClient,
  Session
} from "@supabase/supabase-js";

const supabaseUrl =
  "https://wotovotafnfxgljbigju.supabase.co";

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

export default function CalendarSummary() {
  const [status, setStatus] =
    useState("Checking calendar...");

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  async function loadCalendar(
    session: Session
  ) {
    setLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/google-calendar`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${session.access_token}`,

            apikey:
              supabaseAnonKey,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            refresh_token:
              session.provider_refresh_token ||
              undefined
          })
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          "Calendar function error:",
          result
        );

        setEvents([]);
        setConnected(false);

        if (
          response.status === 404
        ) {
          setStatus(
            "Google Calendar is not connected."
          );
        } else if (
          response.status === 401
        ) {
          setStatus(
            "Google Calendar needs to be reconnected."
          );
        } else {
          setStatus(
            "Calendar events could not be loaded."
          );
        }

        return;
      }

      setEvents(
        result.events || []
      );

      setConnected(true);

      setStatus(
        "Google Calendar connected"
      );
    } catch (error) {
      console.error(
        "Unable to load calendar:",
        error
      );

      setEvents([]);
      setConnected(false);

      setStatus(
        "Calendar events could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSession(
    session: Session | null
  ) {
    if (!session) {
      setConnected(false);
      setEvents([]);

      setStatus(
        "Google Calendar is not connected."
      );

      setLoading(false);

      return;
    }

    await loadCalendar(
      session
    );
  }

  useEffect(() => {
    const start =
      async () => {
        const {
          data,
          error
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "Unable to read session:",
            error
          );

          setStatus(
            "Unable to check Google Calendar."
          );

          setLoading(false);

          return;
        }

        await handleSession(
          data.session
        );
      };

    start();

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          handleSession(
            session
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function connectGoogleCalendar() {
    setStatus(
      "Connecting Google Calendar..."
    );

    const { error } =
      await supabase.auth.signInWithOAuth(
        {
          provider: "google",

          options: {
            scopes:
              "https://www.googleapis.com/auth/calendar.events",

            redirectTo:
              "https://family-os.r-fierling.workers.dev",

            queryParams: {
              access_type:
                "offline",

              prompt:
                "consent"
            }
          }
        }
      );

    if (error) {
      console.error(
        "Google connection error:",
        error
      );

      setStatus(
        "Google Calendar connection failed."
      );

      alert(
        error.message
      );
    }
  }

  function getEventDate(
    event: CalendarEvent
  ) {
    const value =
      event.start?.dateTime ||
      event.start?.date;

    if (!value) {
      return null;
    }

    return new Date(value);
  }

  function isSameDay(
    first: Date,
    second: Date
  ) {
    return (
      first.getFullYear() ===
        second.getFullYear() &&
      first.getMonth() ===
        second.getMonth() &&
      first.getDate() ===
        second.getDate()
    );
  }

  function isToday(
    event: CalendarEvent
  ) {
    const date =
      getEventDate(event);

    if (!date) {
      return false;
    }

    return isSameDay(
      date,
      new Date()
    );
  }

  function isTomorrow(
    event: CalendarEvent
  ) {
    const date =
      getEventDate(event);

    if (!date) {
      return false;
    }

    const tomorrow =
      new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    return isSameDay(
      date,
      tomorrow
    );
  }

  function formatTime(
    event: CalendarEvent
  ) {
    if (
      !event.start?.dateTime
    ) {
      return "All day";
    }

    const date =
      new Date(
        event.start.dateTime
      );

    return date.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );
  }

  function formatDate(
    event: CalendarEvent
  ) {
    const date =
      getEventDate(event);

    if (!date) {
      return "";
    }

    return date.toLocaleDateString(
      [],
      {
        weekday: "short",
        month: "short",
        day: "numeric"
      }
    );
  }

  const todayEvents =
    events.filter(isToday);

  const tomorrowEvents =
    events.filter(isTomorrow);

  const upcomingEvents =
    events.filter(
      (event) =>
        !isToday(event) &&
        !isTomorrow(event)
    );

  if (loading) {
    return (
      <>
        <h3>Today</h3>

        <p>
          Loading your calendar...
        </p>
      </>
    );
  }

  if (!connected) {
    return (
      <>
        <h3>Today</h3>

        <p>
          {status}
        </p>

        <button
          className="btn"
          onClick={
            connectGoogleCalendar
          }
        >
          Connect Google Calendar
        </button>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px"
        }}
      >
        <div>
          <h3
            style={{
              marginBottom: "4px"
            }}
          >
            Today
          </h3>

          <span
            style={{
              fontSize: "12px",
              opacity: 0.65
            }}
          >
            Calendar connected ✓
          </span>
        </div>
      </div>

      {todayEvents.length === 0 ? (
        <p>
          Nothing scheduled today.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px"
          }}
        >
          {todayEvents.map(
            (event) => (
              <div
                key={event.id}
                style={{
                  padding:
                    "10px 0",
                  borderBottom:
                    "1px solid rgba(128,128,128,0.2)"
                }}
              >
                <strong>
                  {event.summary}
                </strong>

                <div
                  style={{
                    fontSize:
                      "13px",
                    marginTop:
                      "3px"
                  }}
                >
                  {formatTime(
                    event
                  )}
                </div>

                {event.location && (
                  <div
                    style={{
                      fontSize:
                        "12px",
                      marginTop:
                        "3px",
                      opacity:
                        0.75
                    }}
                  >
                    📍{" "}
                    {
                      event.location
                    }
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {tomorrowEvents.length >
        0 && (
        <div
          style={{
            marginTop: "20px"
          }}
        >
          <strong>
            Tomorrow
          </strong>

          <div
            style={{
              display: "grid",
              gap: "8px",
              marginTop: "8px"
            }}
          >
            {tomorrowEvents.map(
              (event) => (
                <div
                  key={
                    event.id
                  }
                >
                  <strong>
                    {
                      event.summary
                    }
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "13px"
                    }}
                  >
                    {formatTime(
                      event
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {upcomingEvents.length >
        0 && (
        <div
          style={{
            marginTop: "20px"
          }}
        >
          <strong>
            Coming up
          </strong>

          <div
            style={{
              display: "grid",
              gap: "8px",
              marginTop: "8px"
            }}
          >
            {upcomingEvents
              .slice(0, 4)
              .map(
                (event) => (
                  <div
                    key={
                      event.id
                    }
                  >
                    <strong>
                      {
                        event.summary
                      }
                    </strong>

                    <div
                      style={{
                        fontSize:
                          "13px"
                      }}
                    >
                      {formatDate(
                        event
                      )}
                      {" · "}
                      {formatTime(
                        event
                      )}
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      )}
    </>
  );
}
