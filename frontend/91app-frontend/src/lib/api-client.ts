import { getAccessToken } from "./session";

// ADR 0003：所有 API 回應走統一 envelope，失敗時帶 errors 與 traceId。
type SuccessEnvelope<T> = {
  success: true;
  data: T;
  message: string;
};

type FailureEnvelope = {
  success: false;
  data: null;
  message: string;
  errors?: string[];
  traceId?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];
  readonly traceId: string;

  constructor(payload: FailureEnvelope, status: number) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.errors = payload.errors ?? [];
    this.traceId = payload.traceId ?? "";
  }
}

/**
 * 帶 token 的 fetch：統一補上 Authorization: Bearer、解讀 envelope，
 * 失敗一律丟 ApiError（含 traceId）供呼叫端顯示。
 */
export async function authedFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<SuccessEnvelope<T>> {
  const headers = new Headers(init.headers);
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });
  const payload = await response.json() as SuccessEnvelope<T> | FailureEnvelope;

  if (!response.ok || !payload.success) {
    throw new ApiError(payload as FailureEnvelope, response.status);
  }

  return payload;
}
