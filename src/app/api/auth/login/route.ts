import { NextResponse } from "next/server";
import { buildRedirectUri, createState } from "@/lib/auth/session";

export async function GET() {
  const clientId = process.env.MY_MLH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "MY_MLH_CLIENT_ID is not configured" },
      { status: 500 },
    );
  }

  const state = await createState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: buildRedirectUri(),
    response_type: "code",
    scope: "user:read:profile user:read:email",
    state,
  });

  return NextResponse.redirect(
    `https://my.mlh.io/oauth/authorize?${params.toString()}`,
  );
}
