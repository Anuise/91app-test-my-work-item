import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/lib/server-auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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

  const session = await response.json() as {
    data: { role: "User" | "Admin" };
  };
  if (session.data.role !== "Admin") {
    redirect("/work-items?notice=forbidden");
  }

  return children;
}
