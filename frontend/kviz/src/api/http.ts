// src/api/http.ts

// 1. Define Base URLs from Environment Variables (with fallbacks for local dev)
const AUTH_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const QUIZ_BASE = import.meta.env.VITE_SERVICE_API_URL || "http://localhost:5001";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

function isFormData(x: any): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

// 2. Core Request Function
async function request<T>(
  url: string,
  { method = "GET", body, headers }: FetchOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };
  let finalBody: BodyInit | undefined = undefined;

  if (body !== undefined && body !== null) {
    if (isFormData(body)) {
      finalBody = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  // Use the absolute URL provided by the clients below
  const res = await fetch(url, {
    method,
    credentials: "include", // 🔑 CRITICAL: Sends/receives HttpOnly cookies
    headers: finalHeaders,
    body: finalBody,
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

// 3. Client Factory (Pre-appends the correct Base URL)
function createClient(baseUrl: string, defaultHeaders?: Record<string, string>) {
  return {
    get: <T>(url: string, headers?: Record<string, string>) =>
      request<T>(`${baseUrl}${url}`, {
        method: "GET",
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    post: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(`${baseUrl}${url}`, {
        method: "POST",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    patch: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(`${baseUrl}${url}`, {
        method: "PATCH",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    put: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(`${baseUrl}${url}`, {
        method: "PUT",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    delete: <T>(url: string, headers?: Record<string, string>) =>
      request<T>(`${baseUrl}${url}`, {
        method: "DELETE",
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),
  };
}

// 4. ✅ EXPORTS: Each client now knows exactly which port to talk to
// authHttp -> Port 5000
export const authHttp = createClient(AUTH_BASE);

// quizHttp -> Port 5001
export const quizHttp = createClient(QUIZ_BASE);

// serverHttp usually refers to the main auth/user server
export const serverHttp = authHttp;
