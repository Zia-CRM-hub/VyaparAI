/** Tiny typed fetch helper for client components. Throws Error with the server's validation message. */
export async function api<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: { "content-type": "application/json" },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const issues = json?.error?.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ");
    throw new Error(issues || json?.error?.message || "Request failed");
  }
  return json as T;
}
