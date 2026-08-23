import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = getCloudflareContext();

  const bindings = env as Record<string, string | undefined>;

  const clientId = bindings.GOOGLE_CLIENT_ID;
  const redirectUri = bindings.GOOGLE_REDIRECT_URI;

  const scope =
    bindings.GOOGLE_CALENDAR_SCOPES ||
    "https://www.googleapis.com/auth/calendar.events";

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        stage: "configuration",
        error: "GOOGLE_CLIENT_ID is missing from Cloudflare bindings."
      },
      { status: 500 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      {
        success: false,
        stage: "configuration",
        error: "GOOGLE_REDIRECT_URI is missing from Cloudflare bindings."
      },
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
