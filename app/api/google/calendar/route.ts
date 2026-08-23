import { NextRequest, NextResponse } from "next/server";
import { googleCalendarClient } from "../../../../lib/google";
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.accessToken) return NextResponse.json({error:"Missing access token"},{status:400});
  const calendar = googleCalendarClient(body.accessToken, body.refreshToken);
  const result = await calendar.events.insert({calendarId:"primary",requestBody:{summary:body.title,location:body.location || undefined,description:body.description || undefined,start:{dateTime:body.start,timeZone:body.timeZone || "America/Toronto"},end:{dateTime:body.end,timeZone:body.timeZone || "America/Toronto"}}});
  return NextResponse.json({id:result.data.id, htmlLink:result.data.htmlLink});
}
