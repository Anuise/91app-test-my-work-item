import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "需要登入才能存取此資源",
        errors: ["Authentication required"],
      },
      { status: 401 },
    );
  }

  const body = await request.json();
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/work-items/bulk-confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await backendResponse.json();

  return NextResponse.json(payload, { status: backendResponse.status });
}
