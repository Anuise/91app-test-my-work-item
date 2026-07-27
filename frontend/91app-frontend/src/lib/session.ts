export type UserRole = "User" | "Admin";

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
};

export type Session = {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
};

// ADR 0010 補註 B：JWT 存於 localStorage，請求時以 Authorization: Bearer 攜帶。
const STORAGE_KEY = "my-work-item-session";

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readSession(): Session | null {
  // Client Component 在 server 端預渲染時沒有 localStorage，一律視為未登入。
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  let session: Session;
  try {
    session = JSON.parse(raw) as Session;
  } catch {
    // localStorage 內容可被使用者手動改壞，解析失敗即視為未登入並清掉。
    clearSession();
    return null;
  }

  // Token 過期後直接視為未登入，讓守衛導回登入頁，而不是先渲染再吃 401。
  if (!session.accessToken || Date.parse(session.expiresAt) <= Date.now()) {
    clearSession();
    return null;
  }

  return session;
}

let snapshotRaw: string | null = null;
let snapshot: Session | null = null;

// useSyncExternalStore 要求 snapshot 穩定：localStorage 原始字串沒變就回同一個物件。
export function getSessionSnapshot(): Session | null {
  const raw = typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = readSession();
  }

  return snapshot;
}

export function subscribeSession(onChange: () => void): () => void {
  // 其他 tab 登入／登出時同步（同一 tab 的變更由導覽本身觸發重新渲染）。
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function getAccessToken(): string | null {
  return readSession()?.accessToken ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
