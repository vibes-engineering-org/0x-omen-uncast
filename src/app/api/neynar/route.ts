import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const identifier = searchParams.get("identifier");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit") || "50";

  console.log("Neynar API request:", { action, identifier, type, limit });

  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    console.error("NEYNAR_API_KEY not found in environment variables");
    console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('NEYNAR')));
    return NextResponse.json(
      { error: "Neynar API key is required. Please check your environment configuration." },
      { status: 500 }
    );
  }
  
  console.log("Using NEYNAR_API_KEY:", apiKey?.slice(0, 8) + "...");

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

    console.log("Neynar API URL:", url);

    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Neynar API error:", {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorText: errorText
      });
      return NextResponse.json(
        { error: `Neynar API Error: ${response.statusText}`, details: errorText },
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