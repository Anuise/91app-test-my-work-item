import { screen } from "@testing-library/react";
import { renderWithProviders as render } from "@/test-utils";
import { describe, expect, test, vi } from "vitest";
import WorkItemDetailView from "./WorkItemDetailView";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

function stubDetail(data: unknown, status = 200, success = true) {
  const body = success
    ? { success: true, data, message: "取得工作項目詳情成功" }
    : { success: false, data: null, message: "找不到工作項目", errors: ["Work item not found"], traceId: "trace-1" };
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("WorkItemDetailView", () => {
  test("顯示 id、title、description、狀態與時間欄位", async () => {
    stubDetail({
      id: "wi-1",
      title: "設定開發環境",
      description: "安裝 .NET 與 Node.js",
      status: "Confirmed",
      createdAt: "2026-07-26T01:00:00Z",
      updatedAt: "2026-07-26T05:00:00Z",
    });

    render(<WorkItemDetailView id="wi-1" backHref="/work-items?sortOrder=asc" />);

    expect(await screen.findByRole("heading", { name: "設定開發環境" })).toBeInTheDocument();
    expect(screen.getByText("wi-1")).toBeInTheDocument();
    expect(screen.getByText("安裝 .NET 與 Node.js")).toBeInTheDocument();
    // 狀態同時出現在標題膠囊與「我的狀態」欄位。
    expect(screen.getAllByText("已確認").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("建立時間")).toBeInTheDocument();
    expect(screen.getByText("最後更新時間")).toBeInTheDocument();
  });

  test("描述為空時顯示無描述提示", async () => {
    stubDetail({
      id: "wi-2",
      title: "部署",
      description: null,
      status: "Pending",
      createdAt: "2026-07-26T01:00:00Z",
      updatedAt: "2026-07-26T01:00:00Z",
    });

    render(<WorkItemDetailView id="wi-2" backHref="/work-items" />);

    expect(await screen.findByRole("heading", { name: "部署" })).toBeInTheDocument();
    expect(screen.getByText("（無描述）")).toBeInTheDocument();
  });

  test("項目不存在時顯示錯誤畫面", async () => {
    stubDetail(null, 404, false);

    render(<WorkItemDetailView id="missing" backHref="/work-items" />);

    expect(
      await screen.findByText("找不到此工作項目，或目前無法載入，請返回列表後再試"),
    ).toBeInTheDocument();
  });

  test("返回列表連結保留原列表脈絡", () => {
    stubDetail({
      id: "wi-1",
      title: "設定開發環境",
      description: null,
      status: "Pending",
      createdAt: "2026-07-26T01:00:00Z",
      updatedAt: "2026-07-26T01:00:00Z",
    });

    render(<WorkItemDetailView id="wi-1" backHref="/work-items?sortOrder=asc" />);

    expect(screen.getByRole("link", { name: /返回列表/ })).toHaveAttribute(
      "href",
      "/work-items?sortOrder=asc",
    );
  });
});
