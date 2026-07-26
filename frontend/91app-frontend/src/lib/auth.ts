const PASSWORD_SALT = process.env.NEXT_PUBLIC_PASSWORD_SALT ?? "MyWorkItem-System-Salt-v1";

type LoginSuccess = {
  success: true;
  data: {
    expiresAt: string;
    user: {
      id: string;
      name: string;
      role: "User" | "Admin";
    };
  };
  message: string;
};

type LoginFailure = {
  success: false;
  data: null;
  message: string;
  errors: string[];
  traceId: string;
};

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password + PASSWORD_SALT);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function login(username: string, password: string): Promise<LoginSuccess> {
  const clientHash = await hashPassword(password);
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, clientHash }),
  });
  const payload = await response.json() as LoginSuccess | LoginFailure;

  if (!response.ok || !payload.success) {
    throw payload;
  }

  return payload;
}
