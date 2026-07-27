import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "./route";

function adminRequest(token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new Request("http://localhost/api/admin/work-items", { ...init, headers });
}

describe("Admin Work Item API proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  test("沒有 Bearer token 時 GET 回傳 401", async () => {
    const response = await GET(adminRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      success: false,
      errors: ["Authentication required"],
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("帶 User token 時 GET 轉發後端 403", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "權限不足，僅限 Admin 角色",
      errors: ["Permission Denied: Admin role required"],
      traceId: "trace-403",
    }), { status: 403 }));

    const response = await GET(adminRequest("user-jwt"));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ traceId: "trace-403" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/work-items",
      expect.objectContaining({ headers: { Authorization: "Bearer user-jwt" } }),
    );
  });

  test("帶 Admin token 時 POST 轉發請求與回應", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "新的工作項目", description: null },
      message: "建立工作項目成功",
    }), { status: 201 }));

    const response = await POST(adminRequest("admin-jwt", {
      method: "POST",
      body: JSON.stringify({ title: "新的工作項目", description: null }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/work-items",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer admin-jwt", "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新的工作項目", description: null }),
      }),
    );
  });

  test("沒有 Bearer token 時 POST 回傳 401", async () => {
    const response = await POST(adminRequest(undefined, {
      method: "POST",
      body: JSON.stringify({ title: "新的工作項目" }),
    }));

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
