import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const store = await cookies();
  const authenticated = store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
  return NextResponse.json({ authenticated });
}
