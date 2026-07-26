import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import WorkItemsPage from "./page";

const { getCookie, redirect } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

vi.mock("next/navigation", () => ({ redirect }));

describe("工作項目登入狀態", () => {
  beforeEach(() => {
    getCookie.mockReturnValue({ value: "signed-jwt" });
    redirect.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { id: "user-id", name: "User", role: "User" },
      message: "登入狀態有效",
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
  });

  test("重新整理後由伺服器驗證 HttpOnly session", async () => {
    render(await WorkItemsPage());

    expect(screen.getByRole("heading", { name: "我的工作項目" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5206/api/v1/auth/session",
      {
        cache: "no-store",
        headers: { Authorization: "Bearer signed-jwt" },
      },
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});
