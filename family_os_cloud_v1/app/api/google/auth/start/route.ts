import {NextResponse} from "next/server";import {googleOAuth} from "../../../../../lib/google";
export async function GET(){const oauth=googleOAuth();const url=oauth.generateAuthUrl({access_type:"offline",prompt:"consent",scope:[process.env.GOOGLE_CALENDAR_SCOPES||"https://www.googleapis.com/auth/calendar.events"]});return NextResponse.redirect(url)}
