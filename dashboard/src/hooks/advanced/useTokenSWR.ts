import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";

/**
 * SWR wrapper for authenticated SDK calls. The request is skipped while there
 * is no session token or when `key` is null.
 */
export function useTokenSWR<T>(
  key: readonly unknown[] | null,
  fetcher: (jwt: string) => Promise<T>,
) {
  const { token } = useAuth();
  return useSWR<T>(token && key ? [...key, token] : null, () => fetcher(token as string), {
    revalidateOnFocus: false,
  });
}

/** Extracts a readable message from SDK (APIError) or generic errors. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { messages?: string[]; message?: string };
  if (Array.isArray(e?.messages) && e.messages.length > 0) {
    return e.messages.join(", ");
  }
  return e?.message || fallback;
}

/** Triggers a browser download for a blob returned by the SDK. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** YYYY-MM-DD in local time. */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
