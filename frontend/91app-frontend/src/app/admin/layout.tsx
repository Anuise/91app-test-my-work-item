"use client";

import AuthGuard from "@/components/auth-guard";

// ADR 0011：/admin/* 僅 Admin 可進入；前端依 Claims 攔截，後端仍以 401/403 為準。
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthGuard requireAdmin>{children}</AuthGuard>;
}
