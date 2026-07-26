import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Home from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("登入頁", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("有效帳號只送出 ClientHash，保存 token 並進入工作項目", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: {
        expiresAt: "2026-07-27T12:00:00Z",
        user: { id: "user-id", name: "User", role: "User" },
      },
      message: "登入成功",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText("帳號"), "user");
    await user.type(screen.getByLabelText("密碼"), "User123!");
    await user.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/auth/login");
    const payload = JSON.parse(String(request?.body));
    expect(payload).toEqual({
      username: "user",
      clientHash: "e73b3e692eacfa6219213cac29e48e053064d9ee138ee1d4a28b2a935e289d3a",
    });
    expect(JSON.stringify(payload)).not.toContain("User123!");
    expect(push).toHaveBeenCalledWith("/work-items");
  });

  test("無效憑證顯示可追蹤錯誤", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      success: false,
      data: null,
      message: "帳號或密碼錯誤",
      errors: ["提供的登入資訊無法驗證"],
      traceId: "trace-123",
    }), { status: 401, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText("帳號"), "user");
    await user.type(screen.getByLabelText("密碼"), "wrong");
    await user.click(screen.getByRole("button", { name: "登入" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("帳號或密碼錯誤");
    expect(screen.getByRole("alert")).toHaveTextContent("trace-123");
    expect(push).not.toHaveBeenCalled();
  });
});
