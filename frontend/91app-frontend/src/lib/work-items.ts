import { authedFetch } from "./api-client";

export type WorkItemStatus = "Pending" | "Confirmed";

export type WorkItemListItem = {
  id: string;
  title: string;
  description: string | null;
  status: WorkItemStatus;
  createdAt: string;
};

export type SortOrder = "asc" | "desc";

// ADR 0015：排序欄位白名單；ADR 0012：個人化狀態過濾三態。
export type SortBy = "createdAt" | "title";
export type StatusFilter = "All" | "Pending" | "Confirmed";

// ADR 0015：每頁固定 20 筆。
export const PAGE_SIZE = 20;

export type WorkItemListQuery = {
  search: string;
  statusFilter: StatusFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
};

// ADR 0015：列表回應為分頁物件，totalCount 為過濾後總數供前端渲染分頁控制。
export type PagedWorkItems = {
  items: WorkItemListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export async function fetchWorkItems(query: WorkItemListQuery): Promise<PagedWorkItems> {
  const params = new URLSearchParams({
    search: query.search,
    statusFilter: query.statusFilter,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: String(query.page),
    pageSize: String(PAGE_SIZE),
  });
  const { data } = await authedFetch<PagedWorkItems>(`/api/work-items?${params.toString()}`);
  return data;
}

export type WorkItemDetail = {
  id: string;
  title: string;
  description: string | null;
  status: WorkItemStatus;
  createdAt: string;
  updatedAt: string;
};

export async function fetchWorkItem(id: string): Promise<WorkItemDetail> {
  const { data } = await authedFetch<WorkItemDetail>(`/api/work-items/${id}`);
  return data;
}

export type BulkConfirmResult = {
  confirmedCount: number;
  ignoredCount: number;
  message: string;
};

export async function bulkConfirmWorkItems(workItemIds: string[]): Promise<BulkConfirmResult> {
  const { data, message } = await authedFetch<{ confirmedCount: number; ignoredCount: number }>(
    "/api/work-items/bulk-confirm",
    { method: "POST", body: JSON.stringify({ workItemIds }) },
  );
  return { ...data, message };
}

export type RevokeResult = {
  revoked: boolean;
  message: string;
};

export async function revokeWorkItem(workItemId: string): Promise<RevokeResult> {
  const { data, message } = await authedFetch<{ revoked: boolean }>(
    `/api/work-items/${workItemId}/revoke`,
    { method: "POST" },
  );
  return { ...data, message };
}
