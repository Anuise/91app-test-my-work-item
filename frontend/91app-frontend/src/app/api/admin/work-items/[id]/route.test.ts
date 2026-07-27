import { beforeEach, describe, expect, test, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";

function adminRequest(id: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new Request(`http://localhost/api/admin/work-items/${id}`, { ...init, headers });
}

describe("Admin Work Item detail API proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  test("帶 Admin token 時 GET 轉發 id 與 Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "既有標題", description: "既有描述" },
      message: "取得工作項目成功",
    }), { status: 200 }));

    const response = await GET(
      adminRequest("work-item-id", "admin-jwt"),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/work-items/work-item-id",
      expect.objectContaining({ headers: { Authorization: "Bearer admin-jwt" } }),
    );
  });

  test("沒有 Bearer token 時 GET 回傳 401 且不呼叫後端", async () => {
    const response = await GET(
      adminRequest("work-item-id"),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("帶 Admin token 時 PUT 轉發請求與回應", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "更新後標題", description: "更新後描述" },
      message: "更新工作項目成功",
    }), { status: 200 }));

    const response = await PUT(
      adminRequest("work-item-id", "admin-jwt", {
        method: "PUT",
        body: JSON.stringify({ title: "更新後標題", description: "更新後描述" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/work-items/work-item-id",
      expect.objectContaining({
        method: "PUT",
        headers: { Authorization: "Bearer admin-jwt", "Content-Type": "application/json" },
        body: JSON.stringify({ title: "更新後標題", description: "更新後描述" }),
      }),
    );
  });

  test("後端 404 envelope 會原樣回傳", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "找不到工作項目",
      errors: ["Work item not found"],
      traceId: "trace-404",
    }), { status: 404 }));

    const response = await PUT(
      adminRequest("missing", "admin-jwt", {
        method: "PUT",
        body: JSON.stringify({ title: "新標題" }),
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      traceId: "trace-404",
    });
  });

  test("沒有 Bearer token 時 DELETE 回傳 401 且不呼叫後端", async () => {
    const response = await DELETE(
      adminRequest("work-item-id", undefined, { method: "DELETE" }),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      success: false,
      errors: ["Authentication required"],
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("帶 Admin token 時 DELETE 轉發 id 與 Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id" },
      message: "刪除工作項目成功",
    }), { status: 200 }));

    const response = await DELETE(
      adminRequest("work-item-id", "admin-jwt", { method: "DELETE" }),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/work-items/work-item-id",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer admin-jwt" },
      }),
    );
  });

  test("DELETE 後端 404 envelope 會原樣回傳", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "找不到工作項目",
      errors: ["Work item not found"],
      traceId: "trace-delete-404",
    }), { status: 404 }));

    const response = await DELETE(
      adminRequest("missing", "admin-jwt", { method: "DELETE" }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      traceId: "trace-delete-404",
    });
  });
});
