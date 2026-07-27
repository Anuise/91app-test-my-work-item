import { beforeEach, describe, expect, test, vi } from "vitest";
import { PUT } from "./route";

const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

describe("Admin Work Item detail API proxy", () => {
  beforeEach(() => {
    getCookie.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("登入 Admin 時 PUT 轉發請求與回應", async () => {
    getCookie.mockReturnValue({ value: "admin-jwt" });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "更新後標題", description: "更新後描述" },
      message: "更新工作項目成功",
    }), { status: 200 }));

    const response = await PUT(
      new Request("http://localhost/api/admin/work-items/work-item-id", {
        method: "PUT",
        body: JSON.stringify({ title: "更新後標題", description: "更新後描述" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "work-item-id" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5206/api/v1/admin/work-items/work-item-id",
      expect.objectContaining({
        method: "PUT",
        headers: { Authorization: "Bearer admin-jwt", "Content-Type": "application/json" },
        body: JSON.stringify({ title: "更新後標題", description: "更新後描述" }),
      }),
    );
  });

  test("後端 404 envelope 會原樣回傳", async () => {
    getCookie.mockReturnValue({ value: "admin-jwt" });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "找不到工作項目",
      errors: ["Work item not found"],
      traceId: "trace-404",
    }), { status: 404 }));

    const response = await PUT(
      new Request("http://localhost/api/admin/work-items/missing", {
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
});
