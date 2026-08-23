import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope =
    process.env.GOOGLE_CALENDAR_SCOPES ||
    "https://www.googleapis.com/auth/calendar.events";

  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is missing" },
      { status: 500 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_REDIRECT_URI is missing" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent"
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
