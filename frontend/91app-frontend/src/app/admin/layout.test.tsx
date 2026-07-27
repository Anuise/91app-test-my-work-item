import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminLayout from "./layout";

const { getCookie, redirect } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

vi.mock("next/navigation", () => ({ redirect }));

describe("Admin 路由守衛", () => {
  beforeEach(() => {
    getCookie.mockReturnValue({ value: "signed-jwt" });
    redirect.mockReset();
  });

  test("一般 User 直接進入 Admin 路由會被導回列表", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: { id: "user-id", name: "User", role: "User" },
      message: "登入狀態有效",
    }), { status: 200 })));

    await AdminLayout({ children: <div>Admin content</div> });

    expect(redirect).toHaveBeenCalledWith("/work-items?notice=forbidden");
  });

  test("Admin 可以進入管理路由", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: { id: "admin-id", name: "Admin", role: "Admin" },
      message: "登入狀態有效",
    }), { status: 200 })));

    render(await AdminLayout({ children: <div>Admin content</div> }));

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
