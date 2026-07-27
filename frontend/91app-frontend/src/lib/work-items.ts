export type WorkItemStatus = "Pending" | "Confirmed";

export type WorkItemListItem = {
  id: string;
  title: string;
  status: WorkItemStatus;
  createdAt: string;
};

export type SortOrder = "asc" | "desc";

type WorkItemsSuccess = {
  success: true;
  data: WorkItemListItem[];
  message: string;
};

type WorkItemsFailure = {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId?: string;
};

export async function fetchWorkItems(sortOrder: SortOrder): Promise<WorkItemListItem[]> {
  const response = await fetch(`/api/work-items?sortOrder=${sortOrder}`);
  const payload = await response.json() as WorkItemsSuccess | WorkItemsFailure;

  if (!response.ok || !payload.success) {
    throw payload;
  }

  return payload.data;
}

export type BulkConfirmResult = {
  confirmedCount: number;
  ignoredCount: number;
  message: string;
};

type BulkConfirmSuccess = {
  success: true;
  data: { confirmedCount: number; ignoredCount: number };
  message: string;
};

type BulkConfirmFailure = {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId?: string;
};

export async function bulkConfirmWorkItems(workItemIds: string[]): Promise<BulkConfirmResult> {
  const response = await fetch("/api/work-items/bulk-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workItemIds }),
  });
  const payload = await response.json() as BulkConfirmSuccess | BulkConfirmFailure;

  if (!response.ok || !payload.success) {
    throw payload;
  }

  return { ...payload.data, message: payload.message };
}

export type RevokeResult = {
  revoked: boolean;
  message: string;
};

type RevokeSuccess = {
  success: true;
  data: { revoked: boolean };
  message: string;
};

type RevokeFailure = {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId?: string;
};

export async function revokeWorkItem(workItemId: string): Promise<RevokeResult> {
  const response = await fetch(`/api/work-items/${workItemId}/revoke`, {
    method: "POST",
  });
  const payload = await response.json() as RevokeSuccess | RevokeFailure;

  if (!response.ok || !payload.success) {
    throw payload;
  }

  return { ...payload.data, message: payload.message };
}
