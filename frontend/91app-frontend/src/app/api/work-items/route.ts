import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
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

  const sortOrder = request.nextUrl.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const backendUrl = new URL(`${BACKEND_API_URL}/api/v1/work-items`);
  backendUrl.searchParams.set("sortBy", "createdAt");
  backendUrl.searchParams.set("sortOrder", sortOrder);

  const backendResponse = await fetch(backendUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await backendResponse.json();

  return NextResponse.json(payload, { status: backendResponse.status });
}
