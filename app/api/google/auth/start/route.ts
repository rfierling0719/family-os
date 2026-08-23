import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription =
    url.searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.json(
      {
        success: false,
        stage: "google_authorization",
        error: oauthError,
        description: oauthErrorDescription
      },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        stage: "callback",
        error: "Google did not return an authorization code.",
        callbackUrl: url.origin + url.pathname,
        queryParametersReceived: [...url.searchParams.keys()]
      },
      { status: 400 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        stage: "configuration",
        error: "GOOGLE_CLIENT_ID is missing."
      },
      { status: 500 }
    );
  }

  if (!clientSecret) {
    return NextResponse.json(
      {
        success: false,
        stage: "configuration",
        error: "GOOGLE_CLIENT_SECRET is missing."
      },
      { status: 500 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      {
        success: false,
        stage: "configuration",
        error: "GOOGLE_REDIRECT_URI is missing."
      },
      { status: 500 }
    );
  }

  const tokenResponse = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        stage: "token_exchange",
        googleStatus: tokenResponse.status,
        googleResponse: tokenData
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Google Calendar authorization succeeded.",
    accessTokenReceived: Boolean(
      (tokenData as any).access_token
    ),
    refreshTokenReceived: Boolean(
      (tokenData as any).refresh_token
    ),
    expiresIn: (tokenData as any).expires_in ?? null
  });
}
