"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { readSession } from "@/lib/session";
import WorkItemsList from "./WorkItemsList";

function WorkItemsPageContent() {
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  // AuthGuard 通過後才會渲染，此處必然有 session。
  const role = readSession()?.user.role;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-blue-600 uppercase">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">91</span>
            My Work Item
          </div>
          {role === "Admin" ? (
            <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" href="/admin/work-items">
              後台管理
            </Link>
          ) : null}
        </div>
        <div className="mt-14 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          {notice === "forbidden" ? (
            <p className="fixed top-6 right-6 z-50 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg" role="alert">
              權限不足，無法進入後台管理。
            </p>
          ) : null}
          <p className="text-sm font-medium text-blue-600">登入狀態有效</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">我的工作項目</h1>
          <div className="mt-8">
            <WorkItemsList />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function WorkItemsPage() {
  return (
    <AuthGuard>
      <WorkItemsPageContent />
    </AuthGuard>
  );
}
