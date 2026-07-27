export const BACKEND_API_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

// ADR 0010 補註 B：token 一律由瀏覽器以 Authorization: Bearer 攜帶，BFF 只負責原樣轉發。
export function getBearerToken(request: Request): string | undefined {
  const header = request.headers.get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
}
