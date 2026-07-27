import { cookies } from "next/headers";
import Link from "next/link";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "../../../../../lib/server-auth";
import { EditWorkItemForm } from "./edit-work-item-form";

type AdminWorkItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
};

type AdminWorkItemPayload = {
  success: true;
  data: AdminWorkItem;
  message: string;
} | {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId?: string;
};

export default async function EditWorkItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const { id } = await params;
  const response = await fetch(`${BACKEND_API_URL}/api/v1/admin/work-items/${id}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json() as AdminWorkItemPayload;
  const item = response.ok && payload.success ? payload.data : null;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-blue-600" href="/admin/work-items">返回工作項目管理</Link>
        <div className="mt-8 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          <h1 className="text-3xl font-semibold tracking-tight">編輯工作項目</h1>
          {item ? (
            <div className="mt-8">
              <EditWorkItemForm
                id={item.id}
                initialTitle={item.title}
                initialDescription={item.description}
              />
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {payload.message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
