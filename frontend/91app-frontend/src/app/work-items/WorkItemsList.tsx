"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  bulkConfirmWorkItems,
  fetchWorkItems,
  PAGE_SIZE,
  revokeWorkItem,
  type SortBy,
  type SortOrder,
  type StatusFilter,
  type WorkItemListItem,
} from "@/lib/work-items";

const STATUS_LABELS = {
  Pending: "待確認",
  Confirmed: "已確認",
} as const;

// ADR 0009：待確認為暖黃 Capsule，已確認為翠綠 Capsule。
const STATUS_STYLES = {
  Pending: "text-[#D97706] bg-[rgba(254,243,199,0.8)]",
  Confirmed: "text-[#059669] bg-[rgba(209,250,229,0.8)]",
} as const;

// ADR 0012：三態 Capsule 過濾器。
const STATUS_FILTERS = [
  { value: "All", label: "全部" },
  { value: "Pending", label: "待確認" },
  { value: "Confirmed", label: "已確認" },
] as const;

function parseStatusFilter(value: string | null): StatusFilter {
  return value === "Pending" || value === "Confirmed" ? value : "All";
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default function WorkItemsList() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 由 URL 還原查詢脈絡（搜尋、過濾、排序、頁碼），讓從詳情返回列表時保留原位置。
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    parseStatusFilter(searchParams.get("statusFilter")),
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    searchParams.get("sortBy") === "title" ? "title" : "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
  );
  const [page, setPage] = useState(parsePage(searchParams.get("page")));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // 待撤銷的項目；非 null 時顯示確認對話框，於實際變更前先取得使用者確認。
  const [revokeTarget, setRevokeTarget] = useState<WorkItemListItem | null>(null);

  // ADR 0012：搜尋輸入 300ms debounce，避免每次按鍵都發送請求；條件改變時回到第一頁。
  useEffect(() => {
    if (search === debouncedSearch) {
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setSelectedIds(new Set());
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const listQuery = { search: debouncedSearch, statusFilter, sortBy, sortOrder, page };
  const { data, isLoading, isError } = useQuery({
    // ADR 0012／0015：查詢條件（含分頁）併入 Query Key，條件改變即自動重新取得。
    queryKey: ["work-items", listQuery],
    queryFn: () => fetchWorkItems(listQuery),
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

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeWorkItem(id),
    onSuccess: (result) => {
      // 成功後關閉對話框、回饋結果，並重新取得列表以反映恢復為 Pending 的狀態。
      setRevokeTarget(null);
      setFeedback({ type: "success", text: result.message });
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
    },
    onError: () => {
      // 失敗時關閉對話框並保留原 Confirmed 狀態（未做樂觀更新），顯示可理解錯誤供重試。
      setRevokeTarget(null);
      setFeedback({ type: "error", text: "撤銷失敗，請稍後再試" });
    },
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const visibleIds = items.map((item) => item.id);
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

  // 查詢條件改變時回到第一頁，並清除跨頁殘留的選取（ADR 0015：全選範圍僅當前頁）。
  function resetPagingAndSelection() {
    setPage(1);
    setSelectedIds(new Set());
  }

  function toggleSortOrder() {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    resetPagingAndSelection();
  }

  function toggleSortBy() {
    setSortBy(sortBy === "createdAt" ? "title" : "createdAt");
    resetPagingAndSelection();
  }

  function changeStatusFilter(next: StatusFilter) {
    setStatusFilter(next);
    resetPagingAndSelection();
  }

  function goToPage(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  const listQueryString = new URLSearchParams({
    search: debouncedSearch,
    statusFilter,
    sortBy,
    sortOrder,
    page: String(page),
  }).toString();

  // 列表脈絡以 URL 為持久化來源：查詢條件（含分頁）寫入 query，詳情頁返回時即可還原。
  useEffect(() => {
    router.replace(`${pathname}?${listQueryString}`, { scroll: false });
  }, [router, pathname, listQueryString]);

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
            onClick={toggleSortBy}
          >
            排序依據：{sortBy === "createdAt" ? "建立時間" : "標題"}
          </button>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={toggleSortOrder}
          >
            {sortOrder === "desc" ? (
              <ArrowDownNarrowWide className="size-4" aria-hidden="true" />
            ) : (
              <ArrowUpNarrowWide className="size-4" aria-hidden="true" />
            )}
            {sortOrder === "desc" ? "降冪" : "升冪"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="搜尋標題或描述"
            placeholder="搜尋標題或描述"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white/70 pr-3 pl-9 text-sm text-slate-700 backdrop-blur-md transition duration-200 ease-in-out placeholder:text-slate-400 focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div role="group" aria-label="狀態過濾" className="flex items-center gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              className={`inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500 ${
                statusFilter === option.value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white/70 text-slate-700 hover:border-blue-300 hover:text-blue-600"
              }`}
              onClick={() => changeStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
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
        ) : items.length > 0 ? (
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
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                  // 勾選後整列以淡藍底標示，提供「已選中」視覺回饋；aria-selected 同步給輔助技術。
                  <tr
                    key={item.id}
                    aria-selected={isSelected}
                    className={`border-b border-slate-100 last:border-0 ${isSelected ? "bg-blue-50/70" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`選取 ${item.title}`}
                        className="size-4 cursor-pointer accent-blue-600"
                        checked={isSelected}
                        onChange={() => toggleRow(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/work-items/${item.id}?${listQueryString}`}
                        className="font-medium text-slate-900 underline-offset-2 transition duration-200 ease-in-out hover:text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {item.title}
                      </Link>
                      {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "Confirmed" ? (
                        <button
                          type="button"
                          aria-label={`撤銷確認 ${item.title}`}
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-red-300 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                          onClick={() => setRevokeTarget(item)}
                        >
                          <RotateCcw className="size-4" aria-hidden="true" />
                          撤銷確認
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            <Inbox className="size-8" aria-hidden="true" />
            <p>目前無待辦項目</p>
          </div>
        )}
      </div>

      {totalCount > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            共 {totalCount} 筆，第 {page} / {totalPages} 頁
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              上一頁
            </button>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              下一頁
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {revokeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-dialog-title"
            className="w-full max-w-md rounded-2xl border border-white/50 bg-white/90 p-6 shadow-xl backdrop-blur-md"
          >
            <h3 id="revoke-dialog-title" className="text-lg font-semibold text-slate-900">
              撤銷確認
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              確定要撤銷「{revokeTarget.title}」的確認嗎？狀態將恢復為待確認。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={revokeMutation.isPending}
                onClick={() => setRevokeTarget(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(revokeTarget.id)}
              >
                確認撤銷
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
