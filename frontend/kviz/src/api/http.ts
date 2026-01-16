// src/api/http.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

async function requestJson<T>(
  url: string,
  { method = "GET", body, headers }: FetchOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    credentials: "include", // 🔑 JWT cookie
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err: any = new Error("HTTP Error");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

function createClient() {
  return {
    get: <T>(url: string) => requestJson<T>(url),
    post: <T>(url: string, body?: any) =>
      requestJson<T>(url, { method: "POST", body }),
    patch: <T>(url: string, body?: any) =>
      requestJson<T>(url, { method: "PATCH", body }),
    put: <T>(url: string, body?: any) =>
      requestJson<T>(url, { method: "PUT", body }),
    delete: <T>(url: string) =>
      requestJson<T>(url, { method: "DELETE" }),
  };
}

// ✅ SVI koriste proxy
export const authHttp = createClient();
export const quizHttp = createClient();
export const serverHttp = createClient();
