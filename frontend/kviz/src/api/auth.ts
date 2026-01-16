// services/auth.ts
import { authHttp } from "./http";

export async function login(email: string, password: string) {
  const res = await authHttp.post("/api/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  localStorage.setItem("role", res.data.role);
  return res.data;
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
  const res = await authHttp.post("/api/auth/register", data);
  return res.data;
}

export async function me() {
  const res = await authHttp.get("/api/users/profile");
  return res.data;
}

export async function logout() {
  await authHttp.post("/api/auth/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}
