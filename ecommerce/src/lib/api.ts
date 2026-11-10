export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const token = localStorage.getItem("access_token");
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers: headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}
