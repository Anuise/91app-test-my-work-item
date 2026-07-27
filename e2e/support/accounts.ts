// Seed 帳號由 migration 與啟動初始化器補齊（README「Demo 帳號」），E2E 直接沿用、不自建帳號。
export const ACCOUNTS = {
  user: { username: "user", password: "User123!" },
  user2: { username: "user2", password: "User123!" },
  admin: { username: "admin", password: "Admin123!" },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;
