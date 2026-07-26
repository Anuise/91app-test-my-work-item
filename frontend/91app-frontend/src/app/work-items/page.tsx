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
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-cyan-200 uppercase">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10">91</span>
          My Work Item
        </div>
        <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-cyan-950/20 sm:p-12">
          <p className="text-sm font-medium text-teal-300">登入狀態有效</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">我的工作項目</h1>
          <p className="mt-4 max-w-xl leading-7 text-slate-400">
            身份驗證骨架已就緒。工作項目列表會在後續功能中加入。
          </p>
        </div>
      </section>
    </main>
  );
}
