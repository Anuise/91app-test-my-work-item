import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders as render } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import WorkItemsList from "./WorkItemsList";

// 列表脈絡以 URL 為持久化來源；測試中模擬 next/navigation 與 next/link。
const nav = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => "/work-items",
  useSearchParams: () => new URLSearchParams(nav.search),
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  nav.search = "";
  nav.replace.mockReset();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ADR 0015：列表回應為 { items, page, pageSize, totalCount } 分頁物件。
function pagedBody(items: unknown[], totalCount = items.length) {
  return {
    success: true,
    data: { items, page: 1, pageSize: 20, totalCount },
    message: "取得工作項目列表成功",
  };
}

function stubFetchReturning(items: unknown[], totalCount = items.length) {
  // 每次呼叫都要新的 Response：body 只能被讀取一次，翻頁等多次查詢才不會失敗。
  const fetchMock = vi.fn<(url: string) => Promise<Response>>(
    async () => jsonResponse(pagedBody(items, totalCount)),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

type ListQueryKey = "search" | "statusFilter" | "sortBy" | "sortOrder" | "page";

// 組出元件預期發出的列表查詢 URL；覆寫值不影響參數順序。
function listUrl(overrides: Partial<Record<ListQueryKey, string>> = {}) {
  const params = new URLSearchParams({
    search: "",
    statusFilter: "All",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: "1",
    pageSize: "20",
    ...overrides,
  });
  return `/api/work-items?${params.toString()}`;
}

describe("WorkItemsList", () => {
  test("沒有工作項目時顯示明確空狀態", async () => {
    stubFetchReturning([]);

    render(<WorkItemsList />);

    expect(await screen.findByText("目前無待辦項目")).toBeInTheDocument();
  });

  test("每列顯示識別碼、標題與個人化狀態", async () => {
    stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", description: "更新後描述", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
      { id: "wi-2", title: "撰寫測試", description: null, status: "Confirmed", createdAt: "2026-07-26T02:00:00Z" },
    ]);

    render(<WorkItemsList />);

    expect(await screen.findByText("設定開發環境")).toBeInTheDocument();
    expect(screen.getByText("更新後描述")).toBeInTheDocument();
    expect(screen.getByText("wi-1")).toBeInTheDocument();
    // 狀態以表格儲存格斷言，避免與同名的狀態過濾按鈕混淆。
    expect(screen.getByRole("cell", { name: "待確認" })).toBeInTheDocument();
    expect(screen.getByText("撰寫測試")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "已確認" })).toBeInTheDocument();
  });

  test("預設依建立時間降冪查詢，點擊可切換為升冪", async () => {
    const fetchMock = stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");
    expect(fetchMock).toHaveBeenCalledWith(listUrl(), expect.anything());

    await user.click(screen.getByRole("button", { name: /降冪/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(listUrl({ sortOrder: "asc" }), expect.anything());
    });
  });

  test("可切換排序欄位為標題", async () => {
    const fetchMock = stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");

    await user.click(screen.getByRole("button", { name: "排序依據：建立時間" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(listUrl({ sortBy: "title" }), expect.anything());
    });
    expect(screen.getByRole("button", { name: "排序依據：標題" })).toBeInTheDocument();
  });

  test("狀態過濾切換為待確認時帶入 statusFilter", async () => {
    const fetchMock = stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");

    await user.click(screen.getByRole("button", { name: "待確認" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(listUrl({ statusFilter: "Pending" }), expect.anything());
    });
    expect(screen.getByRole("button", { name: "待確認" })).toHaveAttribute("aria-pressed", "true");
  });

  test("搜尋以 300ms debounce 合併連續輸入為單一請求", async () => {
    const fetchMock = stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");

    await user.type(screen.getByRole("searchbox", { name: "搜尋標題或描述" }), "abc");

    // debounce 過後只發出最終關鍵字的查詢，中間的 a／ab 不應各打一次 API。
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(listUrl({ search: "abc" }), expect.anything());
    });
    const searchedUrls = fetchMock.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes("search=a"));
    expect(searchedUrls).toEqual([listUrl({ search: "abc" })]);
  });

  test("分頁控制依 totalCount 渲染頁數並可翻頁", async () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      id: `wi-${index}`,
      title: `項目 ${index}`,
      description: null,
      status: "Pending",
      createdAt: "2026-07-26T01:00:00Z",
    }));
    const fetchMock = stubFetchReturning(items, 21);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("項目 0");

    expect(screen.getByText("共 21 筆，第 1 / 2 頁")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /上一頁/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /下一頁/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(listUrl({ page: "2" }), expect.anything());
    });
    expect(await screen.findByText("共 21 筆，第 2 / 2 頁")).toBeInTheDocument();
  });

  test("查詢條件改變時回到第一頁", async () => {
    nav.search = "page=3";
    const fetchMock = stubFetchReturning([], 0);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");
    expect(fetchMock).toHaveBeenCalledWith(listUrl({ page: "3" }), expect.anything());

    await user.click(screen.getByRole("button", { name: "已確認" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        listUrl({ statusFilter: "Confirmed", page: "1" }),
        expect.anything(),
      );
    });
  });

  test("沒有選取項目時，確認按鈕為 disabled", async () => {
    stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
    ]);

    render(<WorkItemsList />);

    const confirmButton = await screen.findByRole("button", { name: /確認所選項目/ });
    expect(confirmButton).toBeDisabled();
  });

  test("select-all 勾選目前可見列後啟用確認並顯示數量", async () => {
    stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
      { id: "wi-2", title: "撰寫測試", status: "Pending", createdAt: "2026-07-26T02:00:00Z" },
    ]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("設定開發環境");

    await user.click(screen.getByRole("checkbox", { name: "全選目前項目" }));

    expect(screen.getByRole("button", { name: /確認所選項目（2）/ })).toBeEnabled();
  });

  test("成功批量確認後回饋數量並清除選取", async () => {
    let confirmed = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/work-items/bulk-confirm")) {
        confirmed = true;
        return jsonResponse({
          success: true,
          data: { confirmedCount: 1, ignoredCount: 0 },
          message: "成功確認 1 個項目",
        });
      }
      return jsonResponse(pagedBody([
        {
          id: "wi-1",
          title: "設定開發環境",
          status: confirmed ? "Confirmed" : "Pending",
          createdAt: "2026-07-26T01:00:00Z",
        },
      ]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("設定開發環境");

    await user.click(screen.getByRole("checkbox", { name: "選取 設定開發環境" }));
    await user.click(screen.getByRole("button", { name: /確認所選項目/ }));

    expect(await screen.findByText("成功確認 1 個項目")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /確認所選項目/ })).toBeDisabled();
    });
  });

  test("批量確認失敗時顯示錯誤並保留選取", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/work-items/bulk-confirm")) {
        return jsonResponse(
          { success: false, data: null, message: "fail", errors: ["x"] },
          500,
        );
      }
      return jsonResponse(pagedBody([
        { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
      ]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("設定開發環境");

    await user.click(screen.getByRole("checkbox", { name: "選取 設定開發環境" }));
    await user.click(screen.getByRole("button", { name: /確認所選項目/ }));

    expect(await screen.findByText("批量確認失敗，請稍後再試")).toBeInTheDocument();
    // 保留選取狀態，按鈕仍為 enabled 可重試。
    expect(screen.getByRole("button", { name: /確認所選項目/ })).toBeEnabled();
  });

  test("只有 Confirmed 項目顯示撤銷按鈕", async () => {
    stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
      { id: "wi-2", title: "撰寫測試", status: "Confirmed", createdAt: "2026-07-26T02:00:00Z" },
    ]);

    render(<WorkItemsList />);
    await screen.findByText("設定開發環境");

    expect(screen.getByRole("button", { name: "撤銷 撰寫測試" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "撤銷 設定開發環境" })).not.toBeInTheDocument();
  });

  test("點擊撤銷開啟確認對話框，取消則關閉且不發送請求", async () => {
    const fetchMock = stubFetchReturning([
      { id: "wi-2", title: "撰寫測試", status: "Confirmed", createdAt: "2026-07-26T02:00:00Z" },
    ]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("撰寫測試");

    await user.click(screen.getByRole("button", { name: "撤銷 撰寫測試" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    // 取消不得送出任何撤銷請求。
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/revoke"))).toBe(false);
  });

  test("確認撤銷成功後列表反映 Pending 並顯示成功回饋", async () => {
    let revoked = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/revoke")) {
        revoked = true;
        return jsonResponse({
          success: true,
          data: { revoked: true },
          message: "已撤銷確認，狀態恢復為待確認",
        });
      }
      return jsonResponse(pagedBody([
        {
          id: "wi-2",
          title: "撰寫測試",
          status: revoked ? "Pending" : "Confirmed",
          createdAt: "2026-07-26T02:00:00Z",
        },
      ]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("撰寫測試");

    await user.click(screen.getByRole("button", { name: "撤銷 撰寫測試" }));
    await user.click(screen.getByRole("button", { name: "確認撤銷" }));

    expect(await screen.findByText("已撤銷確認，狀態恢復為待確認")).toBeInTheDocument();
    // 列表反映恢復為待確認，且撤銷按鈕消失。
    expect(await screen.findByRole("cell", { name: "待確認" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "撤銷 撰寫測試" })).not.toBeInTheDocument();
    });
  });

  test("撤銷失敗時顯示錯誤並保留 Confirmed", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/revoke")) {
        return jsonResponse(
          { success: false, data: null, message: "fail", errors: ["x"] },
          500,
        );
      }
      return jsonResponse(pagedBody([
        { id: "wi-2", title: "撰寫測試", status: "Confirmed", createdAt: "2026-07-26T02:00:00Z" },
      ]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("撰寫測試");

    await user.click(screen.getByRole("button", { name: "撤銷 撰寫測試" }));
    await user.click(screen.getByRole("button", { name: "確認撤銷" }));

    expect(await screen.findByText("撤銷失敗，請稍後再試")).toBeInTheDocument();
    // 保留 Confirmed 狀態，撤銷按鈕仍在可重試。
    expect(screen.getByRole("cell", { name: "已確認" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "撤銷 撰寫測試" })).toBeInTheDocument();
  });

  test("依 URL 查詢脈絡還原列表並於詳情連結帶入脈絡", async () => {
    const restored = {
      search: "環境",
      statusFilter: "Confirmed",
      sortBy: "title",
      sortOrder: "asc",
      page: "2",
    } as const;
    nav.search = new URLSearchParams(restored).toString();
    const fetchMock = stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
    ]);

    render(<WorkItemsList />);
    await screen.findByText("設定開發環境");

    expect(fetchMock).toHaveBeenCalledWith(listUrl(restored), expect.anything());
    // 詳情連結帶入目前查詢脈絡，返回列表時即可還原。
    expect(screen.getByRole("link", { name: "設定開發環境" })).toHaveAttribute(
      "href",
      `/work-items/wi-1?${new URLSearchParams(restored).toString()}`,
    );
  });

  test("切換排序方向時同步寫入 URL 以保留脈絡", async () => {
    stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前無待辦項目");

    await user.click(screen.getByRole("button", { name: /降冪/ }));

    await waitFor(() => {
      expect(nav.replace).toHaveBeenCalledWith(
        `/work-items?${new URLSearchParams({
          search: "",
          statusFilter: "All",
          sortBy: "createdAt",
          sortOrder: "asc",
          page: "1",
        }).toString()}`,
        { scroll: false },
      );
    });
  });
});
