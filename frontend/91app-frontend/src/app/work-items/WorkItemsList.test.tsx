import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import WorkItemsList from "./WorkItemsList";

function stubFetchReturning(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    success: true,
    data,
    message: "取得工作項目列表成功",
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WorkItemsList", () => {
  test("沒有工作項目時顯示明確空狀態", async () => {
    stubFetchReturning([]);

    render(<WorkItemsList />);

    expect(await screen.findByText("目前沒有任何工作項目")).toBeInTheDocument();
  });

  test("每列顯示識別碼、標題與個人化狀態", async () => {
    stubFetchReturning([
      { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
      { id: "wi-2", title: "撰寫測試", status: "Confirmed", createdAt: "2026-07-26T02:00:00Z" },
    ]);

    render(<WorkItemsList />);

    expect(await screen.findByText("設定開發環境")).toBeInTheDocument();
    expect(screen.getByText("wi-1")).toBeInTheDocument();
    expect(screen.getByText("待確認")).toBeInTheDocument();
    expect(screen.getByText("撰寫測試")).toBeInTheDocument();
    expect(screen.getByText("已確認")).toBeInTheDocument();
  });

  test("預設依建立時間降冪查詢，點擊可切換為升冪", async () => {
    const fetchMock = stubFetchReturning([]);
    const user = userEvent.setup();

    render(<WorkItemsList />);
    await screen.findByText("目前沒有任何工作項目");
    expect(fetchMock).toHaveBeenCalledWith("/api/work-items?sortOrder=desc");

    await user.click(screen.getByRole("button", { name: /建立時間/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/work-items?sortOrder=asc");
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
      return jsonResponse({
        success: true,
        data: [
          {
            id: "wi-1",
            title: "設定開發環境",
            status: confirmed ? "Confirmed" : "Pending",
            createdAt: "2026-07-26T01:00:00Z",
          },
        ],
        message: "取得工作項目列表成功",
      });
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
      return jsonResponse({
        success: true,
        data: [
          { id: "wi-1", title: "設定開發環境", status: "Pending", createdAt: "2026-07-26T01:00:00Z" },
        ],
        message: "取得工作項目列表成功",
      });
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
});
