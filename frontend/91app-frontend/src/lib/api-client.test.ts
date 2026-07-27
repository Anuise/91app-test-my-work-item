import { beforeEach, describe, expect, test, vi } from "vitest";
import { authedFetch } from "./api-client";
import { saveSession } from "./session";

function requestHeaders() {
  const [, init] = vi.mocked(fetch).mock.calls[0];
  return new Headers(init?.headers);
}

describe("authedFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: [],
      message: "取得工作項目列表成功",
    }), { status: 200 })));
  });

  test("已登入時帶上 Authorization: Bearer", async () => {
    saveSession({
      accessToken: "signed-jwt",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      user: { id: "user-id", name: "user", role: "User" },
    });

    await authedFetch("/api/work-items");

    expect(requestHeaders().get("Authorization")).toBe("Bearer signed-jwt");
  });

  test("未登入時不帶 Authorization", async () => {
    await authedFetch("/api/work-items");

    expect(requestHeaders().get("Authorization")).toBeNull();
  });

  test("token 過期視為未登入，不帶 Authorization", async () => {
    saveSession({
      accessToken: "expired-jwt",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      user: { id: "user-id", name: "user", role: "User" },
    });

    await authedFetch("/api/work-items");

    expect(requestHeaders().get("Authorization")).toBeNull();
  });

  test("帶 body 時自動補上 Content-Type", async () => {
    await authedFetch("/api/work-items/bulk-confirm", {
      method: "POST",
      body: JSON.stringify({ workItemIds: [] }),
    });

    expect(requestHeaders().get("Content-Type")).toBe("application/json");
  });

  test("失敗 envelope 丟出帶 traceId 的 ApiError", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "需要登入才能存取此資源",
      errors: ["Authentication required"],
      traceId: "trace-401",
    }), { status: 401 }));

    await expect(authedFetch("/api/work-items")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "需要登入才能存取此資源",
      errors: ["Authentication required"],
      traceId: "trace-401",
    });
  });
});
