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
});
