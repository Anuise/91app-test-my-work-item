import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import EditWorkItemPage from "./page";

const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("編輯工作項目頁面", () => {
  beforeEach(() => {
    getCookie.mockReturnValue({ value: "admin-jwt" });
  });

  test("載入既有項目時顯示預填標題與描述", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: {
        id: "work-item-id",
        title: "既有標題",
        description: "既有描述",
        createdAt: "2026-07-27T00:00:00Z",
      },
      message: "取得工作項目成功",
    }), { status: 200 })));

    render(await EditWorkItemPage({ params: Promise.resolve({ id: "work-item-id" }) }));

    expect(screen.getByRole("heading", { name: "編輯工作項目" })).toBeInTheDocument();
    expect(screen.getByLabelText("標題")).toHaveValue("既有標題");
    expect(screen.getByLabelText("描述（選填）")).toHaveValue("既有描述");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5206/api/v1/admin/work-items/work-item-id",
      expect.objectContaining({ headers: { Authorization: "Bearer admin-jwt" } }),
    );
  });

  test("項目不存在時顯示錯誤且不渲染儲存表單", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: false,
      data: null,
      message: "找不到工作項目",
      errors: ["Work item not found"],
      traceId: "trace-404",
    }), { status: 404 })));

    render(await EditWorkItemPage({ params: Promise.resolve({ id: "missing" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("找不到工作項目");
    expect(screen.queryByRole("button", { name: "儲存變更" })).not.toBeInTheDocument();
  });
});
