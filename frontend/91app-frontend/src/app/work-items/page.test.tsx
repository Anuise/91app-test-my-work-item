import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import WorkItemsPage from "./page";
import { renderWithProviders, signIn } from "@/test-utils";

const state = vi.hoisted(() => ({ search: "" }));
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

// 頁面與內嵌的 WorkItemsList 都依賴 router/pathname/searchParams，需一併模擬。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/work-items",
  useSearchParams: () => new URLSearchParams(state.search),
}));

describe("工作項目受保護頁面", () => {
  beforeEach(() => {
    state.search = "";
    replace.mockReset();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      message: "取得工作項目列表成功",
    }), { status: 200 })));
  });

  test("未登入時導回登入頁，不渲染列表殼層", async () => {
    renderWithProviders(<WorkItemsPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByRole("heading", { name: "我的工作項目" })).not.toBeInTheDocument();
  });

  test("已登入使用者停留在受保護殼層", async () => {
    signIn("User");

    renderWithProviders(<WorkItemsPage />);

    expect(await screen.findByRole("heading", { name: "我的工作項目" })).toBeInTheDocument();
    // 列表會把查詢脈絡寫回 URL，故只斷言未被導回登入頁。
    expect(replace).not.toHaveBeenCalledWith("/");
  });

  test("Admin 看得到後台管理入口", async () => {
    signIn("Admin");

    renderWithProviders(<WorkItemsPage />);

    expect(await screen.findByRole("link", { name: "後台管理" })).toHaveAttribute(
      "href",
      "/admin/work-items",
    );
  });

  test("一般 User 看不到後台管理入口", async () => {
    signIn("User");

    renderWithProviders(<WorkItemsPage />);

    expect(await screen.findByRole("heading", { name: "我的工作項目" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "後台管理" })).not.toBeInTheDocument();
  });

  test("權限不足導回列表時顯示 Toast 回饋", async () => {
    signIn("User");
    state.search = "notice=forbidden";

    renderWithProviders(<WorkItemsPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("權限不足，無法進入後台管理");
    expect(alert).toHaveClass("fixed");
  });
});
