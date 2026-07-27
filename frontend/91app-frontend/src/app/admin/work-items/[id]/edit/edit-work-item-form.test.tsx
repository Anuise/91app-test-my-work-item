import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EditWorkItemForm } from "./edit-work-item-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("編輯工作項目表單", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("空白標題會顯示驗證錯誤且不送出", async () => {
    const user = userEvent.setup();
    render(
      <EditWorkItemForm
        id="work-item-id"
        initialTitle="既有標題"
        initialDescription="既有描述"
      />,
    );

    const title = screen.getByLabelText("標題");
    await user.clear(title);
    await user.type(title, "   ");
    await user.click(screen.getByRole("button", { name: "儲存變更" }));

    expect(screen.getByText("標題不可為空白")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("成功送出後導向管理列表並轉送更新資料", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "更新後標題", description: "更新後描述" },
      message: "更新工作項目成功",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(
      <EditWorkItemForm
        id="work-item-id"
        initialTitle="既有標題"
        initialDescription="既有描述"
      />,
    );

    await user.clear(screen.getByLabelText("標題"));
    await user.type(screen.getByLabelText("標題"), "  更新後標題  ");
    await user.clear(screen.getByLabelText("描述（選填）"));
    await user.type(screen.getByLabelText("描述（選填）"), "  更新後描述  ");
    await user.click(screen.getByRole("button", { name: "儲存變更" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/work-items?updated=1"));
    expect(fetch).toHaveBeenCalledWith("/api/admin/work-items/work-item-id", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ title: "更新後標題", description: "更新後描述" }),
    }));
  });

  test("更新失敗時顯示錯誤且不誤導向成功列表", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "找不到工作項目",
      errors: ["Work item not found"],
      traceId: "trace-404",
    }), { status: 404, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(
      <EditWorkItemForm
        id="work-item-id"
        initialTitle="既有標題"
        initialDescription="既有描述"
      />,
    );

    await user.click(screen.getByRole("button", { name: "儲存變更" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Work item not found"));
    expect(push).not.toHaveBeenCalled();
  });
});
