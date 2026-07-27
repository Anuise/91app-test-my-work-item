"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSessionSnapshot, readSession, subscribeSession } from "@/lib/session";

type AuthGuardProps = {
  requireAdmin?: boolean;
  children: React.ReactNode;
};

/**
 * 路由守衛：未登入導回登入頁；requireAdmin 且非 Admin 導回前台列表並帶權限不足提示。
 * 前端僅依 localStorage 中的 Claims 做導覽控管，實際授權仍以後端 401/403 為準（ADR 0011）。
 */
export default function AuthGuard({ requireAdmin = false, children }: AuthGuardProps) {
  const router = useRouter();
  // localStorage 在 server 端不存在，getServerSnapshot 一律視為未登入。
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const allowed = session !== null && (!requireAdmin || session.user.role === "Admin");

  useEffect(() => {
    // 不能沿用 render 期的 session：hydration 當次讀到的是 getServerSnapshot（null），
    // 直接判斷會把已登入的使用者誤導回登入頁。effect 在掛載後重讀才是可信狀態。
    const current = readSession();
    if (current === null) {
      router.replace("/");
      return;
    }
    if (requireAdmin && current.user.role !== "Admin") {
      router.replace("/work-items?notice=forbidden");
    }
  }, [session, requireAdmin, router]);

  if (!allowed) {
    return <p className="px-5 py-8 text-sm text-slate-500">驗證登入狀態…</p>;
  }

  return children;
}
