import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
      payload: "eyJkb21haW4iOiIweC1vbWVuLXVuY2FzdC52ZXJjZWwuYXBwIn0",
      signature: "MHg2NGE5NGM4M2M5YjE1MzIyNWZiM2U3NzA3YTE2NmMwNDBhNDQ5NmM0OGQ2M2VlMDQwOWU3NDAzYTJmNzQ2MWY0NDhiYjRjNTg2NGUzZjZmMWUwMzk5NWVhMTJhOWEwMGI2OGM2NTQ0MWNkNTYzYjAwY2Q4YjY3NTAxZWQ1NmU5NTFj",
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "Open",
      webhookUrl: `${appUrl}/api/webhook`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#555555",
      primaryCategory: "social",
      tags: ["farcaster", "threads", "unroll", "casts", "social"],
    },
  };

  return Response.json(config);
}
