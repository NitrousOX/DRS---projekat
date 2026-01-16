import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authHttp } from "../../api/http";

type User = any;

// Ako login endpoint vraća role/user u body (opciono)
type LoginResponse = { role?: string; user?: User; message?: string };

// ---------- API ----------
async function apiLogin(email: string, password: string) {
  // fetch wrapper vrati payload direktno (nema .data)
  return authHttp.post<LoginResponse>("/api/auth/login", { email, password });
}

export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  country: string;
  street: string;
  street_number: string;
};

async function apiRegister(payload: RegisterPayload) {
  return authHttp.post<{ message: string }>("/api/auth/register", payload);
}

async function apiMe() {
  // očekuj { role: "...", ... } ili šta već vraća tvoj backend
  return authHttp.get<User>("/api/users/profile");
}

async function apiLogout() {
  return authHttp.post<{ message: string }>("/api/auth/logout");
}

// ---------- CONTEXT ----------
type AuthState = {
  user: User | null;
  role: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user; // istina dolazi od servera preko /profile

  function setRolePersisted(r: string | null) {
    setRole(r);
    if (r) localStorage.setItem("role", r);
    else localStorage.removeItem("role");
  }

  function clearAuth() {
    setUser(null);
    setRolePersisted(null);
  }

  async function refreshProfile() {
    const u: any = await apiMe(); // ako cookie nije validan -> wrapper baci error (401)
    setUser(u);

    // ako backend vraća role u profilu
    if (u?.role) setRolePersisted(u.role);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      loading,
      isAuthenticated,

      login: async (email, password) => {
        const data = await apiLogin(email, password);

        // opciono: ako login vrati role/user, možeš odmah setovati
        if (data?.user) setUser(data.user);
        if (data?.role) setRolePersisted(data.role);

        // najsigurnije: uvek povuci /profile (server source of truth)
        await refreshProfile();
      },

      register: async (payload) => {
        await apiRegister(payload);
        // auto-login posle registracije
        await apiLogin(payload.email, payload.password);
        await refreshProfile();
      },

      logout: async () => {
        try {
          await apiLogout(); // backend briše cookie
        } catch {
          // ignoriši
        } finally {
          clearAuth();
        }
      },

      refreshProfile,
    }),
    [user, role, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti unutar <AuthProvider>.");
  return ctx;
}
