import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminWorkItemsPage from "./page";
import { renderWithProviders, signIn } from "@/test-utils";

const state = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.search),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Admin 工作項目管理", () => {
  beforeEach(() => {
    state.search = "";
    signIn("Admin");
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
    state.search = "created=1";

    renderWithProviders(<AdminWorkItemsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("工作項目建立成功。");
    expect(await screen.findByText("新的工作項目")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "編輯" })).toHaveAttribute(
      "href",
      "/admin/work-items/work-item-id/edit",
    );
  });

  test("列表以 Bearer token 向 BFF 取得資料", async () => {
    renderWithProviders(<AdminWorkItemsPage />);

    expect(await screen.findByText("新的工作項目")).toBeInTheDocument();
    const [path, init] = vi.mocked(fetch).mock.calls[0];
    expect(path).toBe("/api/admin/work-items");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin-jwt");
  });

  test("更新成功時顯示成功訊息", async () => {
    state.search = "updated=1";

    renderWithProviders(<AdminWorkItemsPage />);

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

    renderWithProviders(<AdminWorkItemsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("權限不足，僅限 Admin 角色");
    expect(screen.getByText("目前沒有工作項目。")).toBeInTheDocument();
  });
});
