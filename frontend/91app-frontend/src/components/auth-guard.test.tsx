import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AuthGuard from "./auth-guard";
import { saveSession } from "@/lib/session";
import { signIn } from "@/test-utils";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("路由守衛", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  test("未登入時導回登入頁且不渲染受保護內容", async () => {
    render(<AuthGuard><div>受保護內容</div></AuthGuard>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("受保護內容")).not.toBeInTheDocument();
  });

  test("token 過期時導回登入頁", async () => {
    saveSession({
      accessToken: "expired-jwt",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      user: { id: "user-id", name: "user", role: "User" },
    });

    render(<AuthGuard><div>受保護內容</div></AuthGuard>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  test("已登入使用者可停留在受保護殼層", async () => {
    signIn("User");

    render(<AuthGuard><div>受保護內容</div></AuthGuard>);

    expect(await screen.findByText("受保護內容")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  test("一般 User 進入需 Admin 的路由被導回列表", async () => {
    signIn("User");

    render(<AuthGuard requireAdmin><div>後台內容</div></AuthGuard>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/work-items?notice=forbidden"));
    expect(screen.queryByText("後台內容")).not.toBeInTheDocument();
  });

  test("hydration 當次讀不到 session 也不得誤導回登入頁", async () => {
    // 模擬 SSR hydration：useSyncExternalStore 首次渲染拿到的是 getServerSnapshot（null）。
    signIn("Admin");
    const session = await import("@/lib/session");
    const snapshot = vi.spyOn(session, "getSessionSnapshot").mockReturnValueOnce(null);

    render(<AuthGuard requireAdmin><div>後台內容</div></AuthGuard>);

    expect(await screen.findByText("後台內容")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    snapshot.mockRestore();
  });

  test("Admin 可進入需 Admin 的路由", async () => {
    signIn("Admin");

    render(<AuthGuard requireAdmin><div>後台內容</div></AuthGuard>);

    expect(await screen.findByText("後台內容")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
