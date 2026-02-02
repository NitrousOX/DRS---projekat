// src/api/http.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

function isFormData(x: any): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

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

  const res = await fetch(url, {
    method,
    credentials: "include", // 🔑 JWT cookie
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

function createClient(defaultHeaders?: Record<string, string>) {
  return {
    get: <T>(url: string, headers?: Record<string, string>) =>
      request<T>(url, {
        method: "GET",
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    post: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(url, {
        method: "POST",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    patch: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(url, {
        method: "PATCH",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    put: <T>(url: string, body?: any, headers?: Record<string, string>) =>
      request<T>(url, {
        method: "PUT",
        body,
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),

    delete: <T>(url: string, headers?: Record<string, string>) =>
      request<T>(url, {
        method: "DELETE",
        headers: { ...(defaultHeaders ?? {}), ...(headers ?? {}) },
      }),
  };
}

// ✅ SVI koriste proxy
export const authHttp = createClient();
export const quizHttp = createClient();
export const serverHttp = createClient();
