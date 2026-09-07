import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wotovotafnfxgljbigju.supabase.co";
const supabaseAnonKey =
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J";

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing authorization."
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const refreshToken = body.refresh_token;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Google refresh token."
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify signed-in user."
        },
        { status: 401 }
      );
    }

    const { error: databaseError } = await supabase
      .from("google_calendar_tokens")
      .upsert(
        {
          user_id: user.id,
          refresh_token: refreshToken,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id"
        }
      );

    if (databaseError) {
      return NextResponse.json(
        {
          success: false,
          error: databaseError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while saving Google token."
      },
      { status: 500 }
    );
  }
}
