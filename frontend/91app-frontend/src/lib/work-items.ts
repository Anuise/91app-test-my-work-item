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
