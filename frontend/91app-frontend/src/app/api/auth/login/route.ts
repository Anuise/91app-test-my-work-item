import { NextResponse } from "next/server";
import { BACKEND_API_URL } from "@/lib/server-auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; clientHash?: string };
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: body.username, clientHash: body.clientHash }),
  });

  // ADR 0010 補註 B：token 由瀏覽器存入 localStorage，BFF 不再寫 cookie，原樣轉發 envelope。
  return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
}
