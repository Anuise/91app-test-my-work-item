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

  // ADR 0015：透明轉發列表查詢參數（sortBy／sortOrder／page／pageSize）；
  // 白名單與非法值的靜默 fallback 一律交由後端契約處理，BFF 不再硬編排序欄位。
  const backendUrl = new URL(`${BACKEND_API_URL}/api/v1/work-items`);
  for (const key of ["sortBy", "sortOrder", "page", "pageSize"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) {
      backendUrl.searchParams.set(key, value);
    }
  }

  const backendResponse = await fetch(backendUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await backendResponse.json();

  return NextResponse.json(payload, { status: backendResponse.status });
}
