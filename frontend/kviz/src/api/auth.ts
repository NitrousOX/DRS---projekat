// services/auth.ts
import { authHttp } from "./http";

type LoginResponse = {
  token: string;
  role: string;
};

export async function login(email: string, password: string) {
  const data = await authHttp.post<LoginResponse>("/api/auth/login", { email, password });

  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);

  return data;
}

export async function register(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  country: string;
  street: string;
  street_number: string;
}) {
  // tip stavi po potrebi
  return await authHttp.post("/api/auth/register", data);
}

export async function me() {
  return await authHttp.get("/api/users/profile");
}

export async function logout() {
  await authHttp.post("/api/auth/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}
