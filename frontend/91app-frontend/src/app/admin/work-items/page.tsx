import { cookies } from "next/headers";
import Link from "next/link";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";
import { AdminWorkItemsList, type AdminWorkItem } from "./admin-work-items-list";

type AdminWorkItemsPayload = {
  success: true;
  data: AdminWorkItem[];
  message: string;
} | {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId?: string;
};

export default async function AdminWorkItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const response = await fetch(`${BACKEND_API_URL}/api/v1/admin/work-items`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json() as AdminWorkItemsPayload;
  const items = response.ok && payload.success ? payload.data : [];
  const loadError = response.ok && payload.success ? "" : payload.message;
  const { created, updated } = await searchParams;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-4">
          <Link className="text-sm font-semibold text-blue-600" href="/work-items">My Work Item</Link>
          <Link className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" href="/admin/work-items/new">
            新增工作項目
          </Link>
        </nav>
        <div className="mt-10 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          {created === "1" ? (
            <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              工作項目建立成功。
            </p>
          ) : null}
          {updated === "1" ? (
            <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              工作項目更新成功。
            </p>
          ) : null}
          {loadError ? (
            <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {loadError}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight">工作項目管理</h1>
          <AdminWorkItemsList items={items} />
        </div>
      </section>
    </main>
  );
}
