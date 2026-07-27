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

// 頁面內嵌的 WorkItemsList 會使用 router/pathname/searchParams 還原列表脈絡，需一併模擬。
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/work-items",
  useSearchParams: () => new URLSearchParams(),
}));

describe("工作項目登入狀態", () => {
  beforeEach(() => {
    getCookie.mockReturnValue({ value: "signed-jwt" });
    redirect.mockReset();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/auth/session")) {
        return new Response(JSON.stringify({
          success: true,
          data: { id: "user-id", name: "User", role: "User" },
          message: "登入狀態有效",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: true,
        data: [],
        message: "取得工作項目列表成功",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
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

  test("Admin 看得到後台管理入口", async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      if (String(url).includes("/auth/session")) {
        return new Response(JSON.stringify({
          success: true,
          data: { id: "admin-id", name: "Admin", role: "Admin" },
          message: "登入狀態有效",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, data: [], message: "取得工作項目列表成功" }));
    });

    render(await WorkItemsPage());

    expect(screen.getByRole("link", { name: "後台管理" })).toHaveAttribute("href", "/admin/work-items");
  });

  test("一般 User 看不到後台管理入口", async () => {
    render(await WorkItemsPage());

    expect(screen.queryByRole("link", { name: "後台管理" })).not.toBeInTheDocument();
  });

  test("權限不足導回列表時顯示 Toast 回饋", async () => {
    render(await WorkItemsPage({ searchParams: Promise.resolve({ notice: "forbidden" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("權限不足，無法進入後台管理");
    expect(screen.getByRole("alert")).toHaveClass("fixed");
  });
});
