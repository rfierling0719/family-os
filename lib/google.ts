import { google } from "googleapis";
import { env } from "cloudflare:workers";

export function googleOAuth() {
  const clientId = env.GOOGLE_CLIENT_ID as string;
  const clientSecret = env.GOOGLE_CLIENT_SECRET as string;
  const redirectUri = env.GOOGLE_REDIRECT_URI as string;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing from Cloudflare runtime bindings");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is missing from Cloudflare runtime bindings");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is missing from Cloudflare runtime bindings");
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
