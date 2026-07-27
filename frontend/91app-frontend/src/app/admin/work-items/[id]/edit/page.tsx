"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "../../../../../lib/api-client";
import { EditWorkItemForm } from "./edit-work-item-form";

type AdminWorkItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
};

export default function EditWorkItemPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-work-item", id],
    queryFn: async () => (await authedFetch<AdminWorkItem>(`/api/admin/work-items/${id}`)).data,
    retry: false,
  });

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-blue-600" href="/admin/work-items">返回工作項目管理</Link>
        <div className="mt-8 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          <h1 className="text-3xl font-semibold tracking-tight">編輯工作項目</h1>
          {isLoading ? (
            <p className="mt-8 text-sm text-slate-500">載入中…</p>
          ) : data ? (
            <div className="mt-8">
              <EditWorkItemForm
                id={data.id}
                initialTitle={data.title}
                initialDescription={data.description}
              />
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error instanceof Error ? error.message : "找不到此工作項目"}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
