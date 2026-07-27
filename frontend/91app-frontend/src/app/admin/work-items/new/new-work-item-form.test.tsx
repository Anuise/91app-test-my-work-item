import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import NewWorkItemForm from "./new-work-item-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("新增工作項目表單", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("空白標題會顯示驗證錯誤且不送出", async () => {
    const user = userEvent.setup();
    render(<NewWorkItemForm />);

    await user.type(screen.getByLabelText("標題"), "   ");
    await user.click(screen.getByRole("button", { name: "建立工作項目" }));

    expect(screen.getByText("標題不可為空白")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("成功送出後導向管理列表", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { id: "work-item-id", title: "新的工作項目", description: "建立流程測試" },
      message: "建立工作項目成功",
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(<NewWorkItemForm />);

    await user.type(screen.getByLabelText("標題"), "新的工作項目");
    await user.type(screen.getByLabelText("描述（選填）"), "建立流程測試");
    await user.click(screen.getByRole("button", { name: "建立工作項目" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/work-items?created=1"));
    expect(fetch).toHaveBeenCalledWith("/api/admin/work-items", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "新的工作項目", description: "建立流程測試" }),
    }));
  });
});
