import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { saveSession, type UserRole } from "@/lib/session";

// 測試輔助：補上全站共用的 QueryClientProvider（ADR 0002），元件測試才能單獨 render。
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// 測試輔助：模擬登入，寫入與 login 相同格式的 localStorage session。
export function signIn(role: UserRole = "User") {
  saveSession({
    accessToken: role === "Admin" ? "admin-jwt" : "user-jwt",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    user: { id: `${role.toLowerCase()}-id`, name: role, role },
  });
}
