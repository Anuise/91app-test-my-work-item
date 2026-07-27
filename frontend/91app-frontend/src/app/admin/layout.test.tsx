import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminLayout from "./layout";
import { renderWithProviders, signIn } from "@/test-utils";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("Admin 路由守衛", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  test("未登入直接進入 Admin 路由會導回登入頁", async () => {
    renderWithProviders(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("一般 User 直接進入 Admin 路由會被導回列表", async () => {
    signIn("User");

    renderWithProviders(<AdminLayout><div>Admin content</div></AdminLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/work-items?notice=forbidden"));
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("Admin 可以進入管理路由", async () => {
    signIn("Admin");

    renderWithProviders(<AdminLayout><div>Admin content</div></AdminLayout>);

    expect(await screen.findByText("Admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
