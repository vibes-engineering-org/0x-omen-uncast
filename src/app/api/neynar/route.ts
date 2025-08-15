import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const identifier = searchParams.get("identifier");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit") || "50";

  if (!process.env.NEYNAR_API_KEY) {
    return NextResponse.json(
      { error: "Neynar API key is required" },
      { status: 500 }
    );
  }

  try {
    let url: string;
    
    if (action === "cast") {
      url = `${NEYNAR_API_URL}/cast?identifier=${identifier}&type=${type}`;
    } else if (action === "conversation") {
      url = `${NEYNAR_API_URL}/cast/conversation?identifier=${identifier}&type=${type}&reply_depth=10&include_chronological_parent_casts=true&limit=${limit}`;
    } else {
      return NextResponse.json(
        { error: "Invalid action parameter" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'api_key': process.env.NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Neynar API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Neynar API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}