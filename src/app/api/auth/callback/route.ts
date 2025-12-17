import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildRedirectUri,
  consumeState,
  setSession,
  toSessionData,
} from "@/lib/auth/session";

const buildErrorRedirect = (req: NextRequest, code: string) => {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
};

export async function GET(req: NextRequest) {
  const clientId = process.env.MY_MLH_CLIENT_ID;
  const clientSecret = process.env.MY_MLH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "MY_MLH_CLIENT_ID and MY_MLH_CLIENT_SECRET are required" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");

  if (providerError) return buildErrorRedirect(req, providerError);
  if (!code) return buildErrorRedirect(req, "missing_code");
  if (!(await consumeState(state)))
    return buildErrorRedirect(req, "state_mismatch");

  const tokenResponse = await fetch("https://my.mlh.io/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: buildRedirectUri(),
    }).toString(),
  });

  if (!tokenResponse.ok)
    return buildErrorRedirect(req, "token_exchange_failed");

  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!tokenJson.access_token)
    return buildErrorRedirect(req, "no_access_token");

  const profileResponse = await fetch("https://api.mlh.com/v4/users/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!profileResponse.ok)
    return buildErrorRedirect(req, "profile_fetch_failed");

  const profile = (await profileResponse.json()) as {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: { url?: string };
    profile_picture?: string | null;
  };

  const gravatarUrl =
    profile.email &&
    `https://www.gravatar.com/avatar/${createHash("md5")
      .update(profile.email.trim().toLowerCase())
      .digest("hex")}?d=identicon`;

  await setSession(
    toSessionData({
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expires_in: tokenJson.expires_in ?? 3600,
      user: {
        id: profile.id,
        firstName: profile.first_name || "NoName",
        lastName: profile.last_name || "NoName",
        email: profile.email,
        avatarUrl:
          profile.avatar?.url || profile.profile_picture || gravatarUrl || null,
      },
    }),
  );

  const redirectUrl = new URL("/events", req.url);
  return NextResponse.redirect(redirectUrl);
}
