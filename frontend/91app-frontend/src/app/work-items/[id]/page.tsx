import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";
import WorkItemDetailView from "./WorkItemDetailView";

export default async function WorkItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/");
  }

  const response = await fetch(`${BACKEND_API_URL}/api/v1/auth/session`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    redirect("/");
  }

  const { id } = await params;
  const query = await searchParams;

  // 保留列表脈絡：原樣帶回列表的查詢字串（目前為排序方向，未來擴充分頁亦可沿用）。
  const listQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      listQuery.set(key, value);
    }
  }
  const backHref = listQuery.size > 0 ? `/work-items?${listQuery.toString()}` : "/work-items";

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
