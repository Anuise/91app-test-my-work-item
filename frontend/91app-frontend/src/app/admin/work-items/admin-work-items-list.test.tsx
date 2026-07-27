import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AdminWorkItemsList } from "./admin-work-items-list";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

function renderWorkItemList() {
  return render(
    <AdminWorkItemsList
      items={[{
        id: "work-item-id",
        title: "待刪除項目",
        description: "保留這筆資料",
        createdAt: "2026-07-27T00:00:00Z",
      }]}
    />,
  );
}

describe("AdminWorkItemsList", () => {
  test("點擊刪除開啟確認對話框，取消則保留原列且不送出請求", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    render(
      <AdminWorkItemsList
        items={[{
          id: "work-item-id",
          title: "待刪除項目",
          description: "保留這筆資料",
          createdAt: "2026-07-27T00:00:00Z",
        }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "刪除 待刪除項目" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("待刪除項目")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("確認刪除成功後移除原列並顯示成功回饋", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id" },
      message: "刪除工作項目成功",
    }), { status: 200 }));

    renderWorkItemList();

    await user.click(screen.getByRole("button", { name: "刪除 待刪除項目" }));
    await user.click(screen.getByRole("button", { name: "確認刪除" }));

    expect(await screen.findByRole("status")).toHaveTextContent("刪除工作項目成功");
    expect(screen.queryByText("待刪除項目")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/work-items/work-item-id", { method: "DELETE" });
  });

  test("刪除 API 失敗時顯示錯誤並保留原列", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "刪除工作項目失敗",
      errors: ["Work item could not be deleted"],
    }), { status: 500 }));

    renderWorkItemList();

    await user.click(screen.getByRole("button", { name: "刪除 待刪除項目" }));
    await user.click(screen.getByRole("button", { name: "確認刪除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Work item could not be deleted");
    expect(screen.getByText("待刪除項目")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("刪除網路失敗時顯示錯誤並保留原列", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new Error("network failure"));

    renderWorkItemList();

    await user.click(screen.getByRole("button", { name: "刪除 待刪除項目" }));
    await user.click(screen.getByRole("button", { name: "確認刪除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("刪除工作項目失敗，請稍後再試");
    expect(screen.getByText("待刪除項目")).toBeInTheDocument();
  });
});
