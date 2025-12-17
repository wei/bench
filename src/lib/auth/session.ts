import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface SessionData {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const SESSION_COOKIE = "bench_session";
const STATE_COOKIE = "mlh_oauth_state";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const getSecret = () => {
  const secret = process.env.MY_MLH_CLIENT_SECRET;
  if (!secret) {
    throw new Error("MY_MLH_CLIENT_SECRET is required for session signing");
  }
  return secret;
};

const signPayload = (payload: string) => {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
};

const encodeSession = (session: SessionData) => {
  const payload = JSON.stringify(session);
  const signature = signPayload(payload);
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  return `${encodedPayload}.${signature}`;
};

const decodeSession = (value: string): SessionData | null => {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = signPayload(payload);
  if (expectedSignature !== signature) return null;

  const parsed = JSON.parse(payload) as SessionData;
  if (Date.now() > parsed.expiresAt) return null;
  return parsed;
};

export const getSession = async () => {
  const cookieStore = await Promise.resolve(cookies());
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
};

export const setSession = async (session: SessionData) => {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
};

export const clearSession = async () => {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

export const createState = async () => {
  const state = randomBytes(16).toString("hex");
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300, // 5 minutes
  });
  return state;
};

export const consumeState = async (incoming?: string | null) => {
  const cookieStore = await Promise.resolve(cookies());
  const storedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.set(STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!incoming || !storedState) return false;
  return storedState === incoming;
};

export const buildRedirectUri = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
    return `${normalized}/api/auth/callback`;
  }

  return "http://localhost:3000/api/auth/callback";
};

export const toSessionData = ({
  access_token,
  refresh_token,
  expires_in,
  user,
}: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: SessionUser;
}): SessionData => ({
  accessToken: access_token,
  refreshToken: refresh_token,
  user,
  expiresAt: Date.now() + expires_in * 1000,
});
