// src/api/http.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

// ---------- core JSON request ----------
async function requestJson<T>(
  url: string,
  { method = "GET", body, headers }: FetchOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };

  // Content-Type samo kad ima body
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    credentials: "include",
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

// ---------- form-data request ----------
async function requestForm<T>(
  url: string,
  method: HttpMethod,
  form: FormData,
  headers?: Record<string, string>
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { ...(headers ?? {}) }, // ne setovati Content-Type
    body: form,
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

// ---------- client factory ----------
function createClient(baseUrl?: string) {
  const withBase = (url: string) => (baseUrl ? `${baseUrl}${url}` : url);

  return {
    get: <T>(url: string) => requestJson<T>(withBase(url)),
    post: <T>(url: string, body?: any) =>
      requestJson<T>(withBase(url), { method: "POST", body }),
    put: <T>(url: string, body?: any) =>
      requestJson<T>(withBase(url), { method: "PUT", body }),
    patch: <T>(url: string, body?: any) =>
      requestJson<T>(withBase(url), { method: "PATCH", body }),
    delete: <T>(url: string) =>
      requestJson<T>(withBase(url), { method: "DELETE" }),

    postForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
      requestForm<T>(withBase(url), "POST", form, headers),
    putForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
      requestForm<T>(withBase(url), "PUT", form, headers),
  };
}

// =====================================================
//  EXPORTI (jasno, bez konfuzije)
// =====================================================

// 1) ISTI ORIGIN (Vite proxy / ili backend na istom domenu) – ne diramo login flow
// 1) ISTI ORIGIN (login, logout, profile ako ide preko proxy-ja)
export const authHttp = createClient();

// 2) USERS/ADMIN backend (sad je na 5001)
export const serverHttp = createClient("http://localhost:5001");

// 3) QUIZ backend (takođe 5001)
export const quizHttp = createClient("http://localhost:5001");

