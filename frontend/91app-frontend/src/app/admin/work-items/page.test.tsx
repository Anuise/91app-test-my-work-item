import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminWorkItemsPage from "./page";

const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

describe("Admin 工作項目管理", () => {
  beforeEach(() => {
    getCookie.mockReturnValue({ value: "signed-jwt" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: [{
        id: "work-item-id",
        title: "新的工作項目",
        description: "建立流程測試",
        createdAt: "2026-07-27T00:00:00Z",
      }],
      message: "取得管理工作項目列表成功",
    }), { status: 200 })));
  });

  test("建立成功時顯示成功訊息與項目", async () => {
    render(await AdminWorkItemsPage({ searchParams: Promise.resolve({ created: "1" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("工作項目建立成功。");
    expect(screen.getByText("新的工作項目")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "編輯" })).toHaveAttribute(
      "href",
      "/admin/work-items/work-item-id/edit",
    );
  });

  test("更新成功時顯示成功訊息", async () => {
    render(await AdminWorkItemsPage({ searchParams: Promise.resolve({ updated: "1" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("工作項目更新成功。");
  });

  test("API 失敗 envelope 會顯示錯誤並保留空列表", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "權限不足，僅限 Admin 角色",
      errors: ["Permission Denied: Admin role required"],
      traceId: "trace-403",
    }), { status: 403 }));

    render(await AdminWorkItemsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("alert")).toHaveTextContent("權限不足，僅限 Admin 角色");
    expect(screen.getByText("目前沒有工作項目。")).toBeInTheDocument();
  });
});
