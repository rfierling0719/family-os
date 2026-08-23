import { NextRequest, NextResponse } from "next/server";
import { googleOAuth } from "../../../../../lib/google";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({error:"Missing OAuth code"},{status:400});
  const oauth = googleOAuth();
  await oauth.getToken(code);
  return new NextResponse(`<html><body style="font-family:system-ui;padding:40px"><h1>Google Calendar connected</h1><p>OAuth succeeded.</p><p>The next step is securely saving the refresh token in Supabase.</p></body></html>`,{headers:{"content-type":"text/html"}});
}
