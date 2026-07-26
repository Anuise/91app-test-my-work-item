"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Inbox } from "lucide-react";
import { fetchWorkItems, type SortOrder } from "@/lib/work-items";

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
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["work-items", { sortOrder }],
    queryFn: () => fetchWorkItems(sortOrder),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">工作項目列表</h2>
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
                  <th className="px-4 py-3 font-medium">識別碼</th>
                  <th className="px-4 py-3 font-medium">標題</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
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
