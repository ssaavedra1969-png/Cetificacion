import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const { exp, sub, ...rest } = session;
  return NextResponse.json({
    authenticated: true,
    user: { id: sub, ...rest },
    expiresAt: exp,
  });
}
