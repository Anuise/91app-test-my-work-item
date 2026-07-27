"use client";

import { useParams, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import WorkItemDetailView from "./WorkItemDetailView";

function WorkItemDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // 保留列表脈絡：原樣帶回列表的查詢字串（目前為排序方向，未來擴充分頁亦可沿用）。
  const listQuery = searchParams.toString();
  const backHref = listQuery.length > 0 ? `/work-items?${listQuery}` : "/work-items";

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-blue-600 uppercase">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">91</span>
          My Work Item
        </div>
        <div className="mt-14 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          <p className="text-sm font-medium text-blue-600">工作項目詳情</p>
          <div className="mt-8">
            <WorkItemDetailView id={id} backHref={backHref} />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function WorkItemDetailPage() {
  return (
    <AuthGuard>
      <WorkItemDetailPageContent />
    </AuthGuard>
  );
}
