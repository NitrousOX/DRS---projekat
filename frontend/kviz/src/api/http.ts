// src/api/http.ts

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

async function request<T>(
  url: string,
  { method = "GET", body, headers }: FetchOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };

  // ✅ Content-Type samo ako postoji body
  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    credentials: "include", // HttpOnly cookie
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


// ================= AUTH / MAIN API =================

export const authHttp = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body?: any) =>
    request<T>(url, { method: "POST", body }),

  put: <T>(url: string, body?: any) =>
    request<T>(url, { method: "PUT", body }),

  patch: <T>(url: string, body?: any) =>
    request<T>(url, { method: "PATCH", body }),

  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" }),
};

// ================= QUIZ SERVICE (DRUGI BACKEND) =================

export const quizHttp = {
  get: <T>(url: string) =>
    request<T>(`http://localhost:5000${url}`),

  post: <T>(url: string, body?: any) =>
    request<T>(`http://localhost:5000${url}`, {
      method: "POST",
      body,
    }),

  patch: <T>(url: string, body?: any) =>
    request<T>(`http://localhost:5000${url}`, {
      method: "PATCH",
      body,
    }),

  delete: <T>(url: string) =>
    request<T>(`http://localhost:5000${url}`, {
      method: "DELETE",
    }),
};


// ================= QUIZ SERVICE (TVOJ BACKEND – 5001) =================

export const quizHttp5001 = {
  get: <T>(url: string) =>
    request<T>(`http://localhost:5001${url}`),

  post: <T>(url: string, body?: any) =>
    request<T>(`http://localhost:5001${url}`, {
      method: "POST",
      body,
    }),

  patch: <T>(url: string, body?: any) =>
    request<T>(`http://localhost:5001${url}`, {
      method: "PATCH",
      body,
    }),

  delete: <T>(url: string) =>
    request<T>(`http://localhost:5001${url}`, {
      method: "DELETE",
    }),
};
