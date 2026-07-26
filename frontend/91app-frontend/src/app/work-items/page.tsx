import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

export default async function WorkItemsPage() {
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

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-blue-600 uppercase">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">91</span>
          My Work Item
        </div>
        <div className="mt-14 rounded-2xl border border-white/50 bg-white/75 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-md sm:p-12">
          <p className="text-sm font-medium text-blue-600">登入狀態有效</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">我的工作項目</h1>
          <p className="mt-4 max-w-xl leading-7 text-slate-600">
            身份驗證骨架已就緒。工作項目列表會在後續功能中加入。
          </p>
        </div>
      </section>
    </main>
  );
}
