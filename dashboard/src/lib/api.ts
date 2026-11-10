import { authService } from "@/lib/auth-service";

const API_URL = "https://api-rm8x.onrender.com/v1";

let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

async function refreshAccessToken(): Promise<string> {
  const refresh = authService.getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    throw new Error("Refresh inválido");
  }

  const { token, refresh_token } = await res.json(); 
  authService.setTokens(token, refresh_token);
  return token;
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const makeRequest = async (token?: string) => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
  };

  let token: string | null = authService.getAccessToken();
  const res = await makeRequest(token ?? undefined);

  if (res.status !== 401) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  }

  if (isRefreshing) {
    return new Promise(resolve => {
      queue.push(async (newToken) => {
        const retry = await makeRequest(newToken);
        resolve(await retry.json());
      });
    });
  }

  isRefreshing = true;

  try {

    const newToken = await refreshAccessToken();


    queue.forEach(fn => fn(newToken));
    queue = [];

    const retry = await makeRequest(newToken);
    return retry.json();
  } catch (err) {
    authService.clearSession();
    window.location.href = "/login";
    throw err;
  } finally {
    isRefreshing = false;
  }
}
