import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

type BackendLoginSuccess = {
  success: true;
  data: {
    accessToken: string;
    expiresAt: string;
    user: {
      id: string;
      name: string;
      role: "User" | "Admin";
    };
  };
  message: string;
};

type BackendLoginFailure = {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId: string;
};

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; clientHash?: string };
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: body.username, clientHash: body.clientHash }),
  });
  const payload = await backendResponse.json() as BackendLoginSuccess | BackendLoginFailure;

  if (!backendResponse.ok || !payload.success) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const response = NextResponse.json({
    success: true,
    data: {
      expiresAt: payload.data.expiresAt,
      user: payload.data.user,
    },
    message: payload.message,
  });
  response.cookies.set(AUTH_COOKIE_NAME, payload.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(payload.data.expiresAt),
    path: "/",
  });

  return response;
}
