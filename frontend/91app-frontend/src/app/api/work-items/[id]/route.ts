import { NextResponse } from "next/server";
import { BACKEND_API_URL, getBearerToken } from "@/lib/server-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getBearerToken(request);
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
    `${BACKEND_API_URL}/api/v1/work-items/${id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  const payload = await backendResponse.json();

  return NextResponse.json(payload, { status: backendResponse.status });
}
