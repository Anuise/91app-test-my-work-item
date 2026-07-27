"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWorkItemForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("標題不可為空白");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const response = await fetch("/api/admin/work-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
      }),
    });
    const payload = await response.json() as {
      success: boolean;
      message: string;
      errors?: string[];
    };

    if (response.ok && payload.success) {
      router.push("/admin/work-items?created=1");
      return;
    }

    setError(payload.errors?.[0] ?? payload.message ?? "建立工作項目失敗");
    setIsSubmitting(false);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">標題</label>
        <input
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {error ? <p className="mt-2 text-sm text-red-600" role="alert">{error}</p> : null}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="description">描述（選填）</label>
        <textarea
          className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <button
        className="h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "建立中…" : "建立工作項目"}
      </button>
    </form>
  );
}
