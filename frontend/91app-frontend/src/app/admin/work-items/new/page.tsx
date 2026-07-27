import Link from "next/link";
import NewWorkItemForm from "./new-work-item-form";

export default function NewWorkItemPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-blue-600" href="/admin/work-items">返回工作項目管理</Link>
        <div className="mt-8 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          <h1 className="text-3xl font-semibold tracking-tight">新增工作項目</h1>
          <div className="mt-8">
            <NewWorkItemForm />
          </div>
        </div>
      </section>
    </main>
  );
}
