"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchWorkItem } from "@/lib/work-items";

const STATUS_LABELS = {
  Pending: "待確認",
  Confirmed: "已確認",
} as const;

// ADR 0009：待確認為暖黃 Capsule，已確認為翠綠 Capsule。
const STATUS_STYLES = {
  Pending: "text-[#D97706] bg-[rgba(254,243,199,0.8)]",
  Confirmed: "text-[#059669] bg-[rgba(209,250,229,0.8)]",
} as const;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-TW", { hour12: false });
}

function WorkItemDetailInner({ id, backHref }: { id: string; backHref: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["work-item", id],
    queryFn: () => fetchWorkItem(id),
    // 不存在的項目應快速回傳錯誤畫面，不重試。
    retry: false,
  });

  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-blue-300 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        返回列表
      </Link>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">載入中…</p>
        ) : isError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            找不到此工作項目，或目前無法載入，請返回列表後再試
          </p>
        ) : data ? (
          <article>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{data.title}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[data.status]}`}>
                {STATUS_LABELS[data.status]}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">識別碼</dt>
                <dd className="mt-1 font-mono text-sm text-slate-600">{data.id}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">描述</dt>
                <dd className="mt-1 text-sm whitespace-pre-line text-slate-900">
                  {data.description ? data.description : <span className="text-slate-400">（無描述）</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">建立時間</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(data.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">最後更新時間</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(data.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">我的狀態</dt>
                <dd className="mt-1 text-sm text-slate-900">{STATUS_LABELS[data.status]}</dd>
              </div>
            </dl>
          </article>
        ) : null}
      </div>
    </div>
  );
}

export default function WorkItemDetailView({ id, backHref }: { id: string; backHref: string }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WorkItemDetailInner id={id} backHref={backHref} />
    </QueryClientProvider>
  );
}
