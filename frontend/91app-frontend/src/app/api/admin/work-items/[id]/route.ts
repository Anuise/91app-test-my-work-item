import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "../../../../../lib/server-auth";

function unauthorizedResponse() {
  return NextResponse.json({
    success: false,
    data: null,
    message: "需要登入才能繼續",
    errors: ["Authentication required"],
  }, { status: 401 });
}

async function getAccessToken() {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/admin/work-items/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await request.json()),
  });
  return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
}
