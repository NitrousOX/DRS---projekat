// src/api/http.ts

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
};

// ================= CORE REQUEST (JSON) =================

async function request<T>(
  url: string,
  { method = "GET", body, headers }: FetchOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };

  // ✅ Content-Type SAMO ako postoji body (sprečava OPTIONS preflight)
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

// ================= FORM DATA (UPLOAD) =================

async function requestForm<T>(
  url: string,
  method: HttpMethod,
  form: FormData,
  headers?: Record<string, string>
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...(headers ?? {}),
      // ❌ NE stavljati Content-Type — browser postavlja boundary
    },
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

// ================= AUTH / MAIN API (ISTI ORIGIN) =================

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

  // uploads
  postForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(url, "POST", form, headers),

  putForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(url, "PUT", form, headers),
};

// ================= QUIZ SERVICE – BACKEND NA 5000 =================

const QUIZ_BASE_5000 = "http://localhost:5000";

export const quizHttp = {
  get: <T>(url: string) => request<T>(`${QUIZ_BASE_5000}${url}`),

  post: <T>(url: string, body?: any) =>
    request<T>(`${QUIZ_BASE_5000}${url}`, { method: "POST", body }),

  patch: <T>(url: string, body?: any) =>
    request<T>(`${QUIZ_BASE_5000}${url}`, { method: "PATCH", body }),

  delete: <T>(url: string) =>
    request<T>(`${QUIZ_BASE_5000}${url}`, { method: "DELETE" }),

  postForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(`${QUIZ_BASE_5000}${url}`, "POST", form, headers),

  putForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(`${QUIZ_BASE_5000}${url}`, "PUT", form, headers),
};

// ================= QUIZ SERVICE – BACKEND NA 5001 =================

const QUIZ_BASE_5001 = "http://localhost:5001";

export const quizHttp5001 = {
  get: <T>(url: string) => request<T>(`${QUIZ_BASE_5001}${url}`),

  post: <T>(url: string, body?: any) =>
    request<T>(`${QUIZ_BASE_5001}${url}`, { method: "POST", body }),

  patch: <T>(url: string, body?: any) =>
    request<T>(`${QUIZ_BASE_5001}${url}`, { method: "PATCH", body }),

  delete: <T>(url: string) =>
    request<T>(`${QUIZ_BASE_5001}${url}`, { method: "DELETE" }),

  postForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(`${QUIZ_BASE_5001}${url}`, "POST", form, headers),

  putForm: <T>(url: string, form: FormData, headers?: Record<string, string>) =>
    requestForm<T>(`${QUIZ_BASE_5001}${url}`, "PUT", form, headers),
};
