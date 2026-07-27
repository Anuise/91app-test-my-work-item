import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const backendResponse = await fetch(
    `${BACKEND_API_URL}/api/v1/work-items/${id}/revoke`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  const payload = await backendResponse.json();

  return NextResponse.json(payload, { status: backendResponse.status });
}
