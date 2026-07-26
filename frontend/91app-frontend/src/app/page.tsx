"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [traceId, setTraceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setTraceId("");
    setIsSubmitting(true);

    try {
      await login(username, password);
      setPassword("");
      router.push("/work-items");
    } catch (reason) {
      const failure = reason as { message?: string; traceId?: string };
      setError(failure.message ?? "目前無法登入，請稍後再試");
      setTraceId(failure.traceId ?? "");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#07111f] px-5 py-10 text-slate-100 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(56,189,248,0.14),transparent_34%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden min-h-[660px] flex-col justify-between border-r border-white/10 p-12 lg:flex">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-cyan-200 uppercase">
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-lg">91</span>
            My Work Item
          </div>
          <div className="max-w-md">
            <p className="mb-5 text-sm font-medium text-teal-300">把工作留在清單，把進度留給自己。</p>
            <h1 className="text-5xl leading-[1.08] font-semibold tracking-tight text-balance">
              一個清楚、可靠的工作確認空間。
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-400">
              登入後即可查看你的工作項目；每個人的確認狀態獨立保存，不會彼此影響。
            </p>
          </div>
          <p className="text-xs tracking-wide text-slate-500">SECURE ACCESS · PERSONAL PROGRESS</p>
        </section>

        <section className="flex min-h-[620px] items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full">
            <div className="mb-9 lg:hidden">
              <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-cyan-200 uppercase">
                <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10">91</span>
                My Work Item
              </span>
            </div>
            <p className="text-sm font-medium text-teal-300">歡迎回來</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">登入你的工作空間</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">輸入由系統管理員提供的帳號與密碼。</p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">帳號</label>
                <input
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="例如：user"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">密碼</label>
                <input
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="輸入密碼"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">
                  <p>{error}</p>
                  {traceId ? <p className="mt-1 text-xs text-rose-200/70">追蹤碼：{traceId}</p> : null}
                </div>
              ) : null}

              <button
                className="flex h-12 w-full items-center justify-center rounded-xl bg-cyan-300 px-5 font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "登入中…" : "登入"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
