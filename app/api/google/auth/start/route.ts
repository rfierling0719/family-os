import { NextResponse } from "next/server";
import { googleOAuth } from "../../../../../lib/google";

export async function GET() {
  const oauth = googleOAuth();

  const scope =
    process.env.GOOGLE_CALENDAR_SCOPES ||
    "https://www.googleapis.com/auth/calendar.events";

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [scope]
  });

  return NextResponse.redirect(url);
}
