import { NextResponse } from "next/server";
import { BACKEND_API_URL, getBearerToken } from "../../../../../lib/server-auth";

function unauthorizedResponse() {
  return NextResponse.json({
    success: false,
    data: null,
    message: "需要登入才能繼續",
    errors: ["Authentication required"],
  }, { status: 401 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/admin/work-items/${id}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getBearerToken(request);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/admin/work-items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
}
