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

export async function fetchWorkItems(sortOrder: SortOrder): Promise<WorkItemListItem[]> {
  const { data } = await authedFetch<WorkItemListItem[]>(`/api/work-items?sortOrder=${sortOrder}`);
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
