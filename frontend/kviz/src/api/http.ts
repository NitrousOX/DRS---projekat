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
  const res = await fetch(url, {
    method,
    credentials: "include", // <<< KLJUČNO ZA HttpOnly COOKIE
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
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

export const authHttp = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: any) =>
    request<T>(url, { method: "POST", body }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, { method: "PUT", body }),
  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" }),
};

// ako ti treba poseban backend (npr. kviz servis)
export const quizHttp = {
  get: <T>(url: string) =>
    request<T>(`http://localhost:5000${url}`),
  post: <T>(url: string, body?: any) =>
    request<T>(`http://localhost:5000${url}`, { method: "POST", body }),
};
