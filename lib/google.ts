import { google } from "googleapis";

export function googleOAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is missing");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is missing");
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

export function googleCalendarClient(
  accessToken: string,
  refreshToken?: string
) {
  const oauth = googleOAuth();

  oauth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({
    version: "v3",
    auth: oauth
  });
}
