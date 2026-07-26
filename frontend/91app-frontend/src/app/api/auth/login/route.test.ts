import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "./route";

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

  test("JWT 只寫入 HttpOnly cookie，不回傳給瀏覽器程式碼", async () => {
    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user", clientHash: "client-hash" }),
    }));

    expect(response.status).toBe(200);
    const [, backendRequest] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(backendRequest?.body))).toEqual({
      username: "user",
      clientHash: "client-hash",
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(await response.json()).toEqual({
      success: true,
      data: {
        expiresAt: "2026-07-27T12:00:00Z",
        user: { id: "user-id", name: "User", role: "User" },
      },
      message: "登入成功",
    });
  });
});
