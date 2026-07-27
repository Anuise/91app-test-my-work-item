import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "./route";

function loginRequest() {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user", clientHash: "client-hash" }),
  });
}

describe("登入 BFF", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        accessToken: "signed-jwt",
        expiresAt: "2026-07-27T12:00:00Z",
        user: { id: "user-id", name: "User", role: "User" },
      },
      message: "登入成功",
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
  });

  test("原樣回傳含 accessToken 的 envelope，且不寫入 cookie", async () => {
    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    const [, backendRequest] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(backendRequest?.body))).toEqual({
      username: "user",
      clientHash: "client-hash",
    });
    // ADR 0010 補註 B：token 交由瀏覽器存 localStorage，BFF 不再設 cookie。
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      success: true,
      data: {
        accessToken: "signed-jwt",
        expiresAt: "2026-07-27T12:00:00Z",
        user: { id: "user-id", name: "User", role: "User" },
      },
      message: "登入成功",
    });
  });

  test("後端失敗 envelope 原樣回傳並保留 traceId", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "帳號或密碼錯誤",
      errors: ["Invalid credentials"],
      traceId: "trace-401",
    }), { status: 401 }));

    const response = await POST(loginRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, traceId: "trace-401" });
  });
});
