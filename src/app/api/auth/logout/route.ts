import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  await clearSession();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  await clearSession();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}
