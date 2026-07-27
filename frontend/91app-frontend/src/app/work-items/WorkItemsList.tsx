"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, CheckCheck, Inbox } from "lucide-react";
import { bulkConfirmWorkItems, fetchWorkItems, type SortOrder } from "@/lib/work-items";

const STATUS_LABELS = {
  Pending: "待確認",
  Confirmed: "已確認",
} as const;

// ADR 0009：待確認為暖黃 Capsule，已確認為翠綠 Capsule。
const STATUS_STYLES = {
  Pending: "text-[#D97706] bg-[rgba(254,243,199,0.8)]",
  Confirmed: "text-[#059669] bg-[rgba(209,250,229,0.8)]",
} as const;

function WorkItemsListInner() {
  const queryClient = useQueryClient();
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["work-items", { sortOrder }],
    queryFn: () => fetchWorkItems(sortOrder),
  });

  const confirmMutation = useMutation({
    mutationFn: (ids: string[]) => bulkConfirmWorkItems(ids),
    onSuccess: (result) => {
      // 成功後清除選取、回饋實際確認數量，並重新取得列表以反映最新狀態。
      setSelectedIds(new Set());
      setFeedback({ type: "success", text: result.message });
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
    },
    onError: () => {
      // 失敗時保留選取狀態，讓使用者可直接重試。
      setFeedback({ type: "error", text: "批量確認失敗，請稍後再試" });
    },
  });

  const visibleIds = data?.map((item) => item.id) ?? [];
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(() => (allSelected ? new Set() : new Set(visibleIds)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">工作項目列表</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedIds.size === 0 || confirmMutation.isPending}
            onClick={() => confirmMutation.mutate([...selectedIds])}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            確認所選項目{selectedIds.size > 0 ? `（${selectedIds.size}）` : ""}
          </button>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setSortOrder((current) => (current === "desc" ? "asc" : "desc"))}
          >
            {sortOrder === "desc" ? (
              <ArrowDownNarrowWide className="size-4" aria-hidden="true" />
            ) : (
              <ArrowUpNarrowWide className="size-4" aria-hidden="true" />
            )}
            建立時間：{sortOrder === "desc" ? "新到舊" : "舊到新"}
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          role={feedback.type === "success" ? "status" : "alert"}
          className={
            feedback.type === "success"
              ? "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">載入中…</p>
        ) : isError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            目前無法載入工作項目，請稍後再試
          </p>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/50">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                  <th className="w-10 px-4 py-3 font-medium">
                    <input
                      type="checkbox"
                      aria-label="全選目前項目"
                      className="size-4 cursor-pointer accent-blue-600"
                      checked={allSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">識別碼</th>
                  <th className="px-4 py-3 font-medium">標題</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`選取 ${item.title}`}
                        className="size-4 cursor-pointer accent-blue-600"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleRow(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-3 text-slate-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            <Inbox className="size-8" aria-hidden="true" />
            <p>目前沒有任何工作項目</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkItemsList() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WorkItemsListInner />
    </QueryClientProvider>
  );
}
