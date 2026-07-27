"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, authedFetch } from "@/lib/api-client";

export type AdminWorkItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
};

type AdminWorkItemsListProps = {
  items: AdminWorkItem[];
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

export function AdminWorkItemsList({ items: initialItems }: AdminWorkItemsListProps) {
  const [items, setItems] = useState(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<AdminWorkItem | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setIsDeleting(true);
    try {
      await authedFetch(`/api/admin/work-items/${target.id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== target.id));
      setFeedback({ type: "success", text: "刪除成功" });
      setDeleteTarget(null);
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason instanceof ApiError
          ? reason.errors[0] ?? reason.message
          : "刪除工作項目失敗，請稍後再試",
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      {feedback ? (
        <p
          className={feedback.type === "success"
            ? "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            : "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"}
          role={feedback.type === "success" ? "status" : "alert"}
        >
          {feedback.text}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">目前沒有工作項目。</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200">
          {items.map((item) => (
            <li className="py-5" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    href={`/admin/work-items/${item.id}/edit`}
                  >
                    編輯
                  </Link>
                  <button
                    aria-label={`刪除 ${item.title}`}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
                    disabled={isDeleting}
                    onClick={() => {
                      setFeedback(null);
                      setDeleteTarget(item);
                    }}
                    type="button"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-white/50 bg-white/90 p-6 shadow-xl backdrop-blur-md"
            role="dialog"
          >
            <h2 className="text-lg font-semibold text-slate-900" id="delete-dialog-title">確定要刪除此項目嗎？</h2>
            <p className="mt-2 text-sm text-slate-600">
              項目「{deleteTarget.title}」將從列表移除。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white/70 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="inline-flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting}
                onClick={handleDelete}
                type="button"
              >
                {isDeleting ? "刪除中…" : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
