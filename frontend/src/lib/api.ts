const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("constructiq_token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("constructiq_token", token);
  }
}

export function getCurrentUserRole(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("constructiq_role") || "PROCUREMENT_MANAGER";
  }
  return "PROCUREMENT_MANAGER";
}

export function setCurrentUserRole(role: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("constructiq_role", role);
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.error?.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}
