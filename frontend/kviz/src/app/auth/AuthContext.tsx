import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authHttp } from "../../api/http";
import type { Role } from "../../utils/roleStorage";

// ================= TYPES =================

type User = any;

type LoginResponse = {
  role?: string;
  user?: User;
  message?: string;
};

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

// ================= HELPERS =================

function normalizeRole(value: any): Role | null {
  if (value === "ADMIN" || value === "admin") return "ADMIN";
  if (value === "MODERATOR" || value === "moderator") return "MODERATOR";
  if (
    value === "PLAYER" ||
    value === "player" ||
    value === "USER" ||
    value === "user"
  )
    return "PLAYER";

  return null;
}

// ================= API =================

async function apiLogin(email: string, password: string) {
  return authHttp.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
}

async function apiRegister(payload: RegisterPayload) {
  return authHttp.post<{ message: string }>("/api/auth/register", payload);
}

async function apiMe() {
  return authHttp.get<User>("/api/users/profile");
}

async function apiLogout() {
  return authHttp.post<{ message: string }>("/api/auth/logout");
}

// ================= CONTEXT =================

type AuthState = {
  user: User | null;
  role: Role | null;
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
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // ===== CLEAR AUTH (LOGOUT CORE) =====
  function clearAuth() {
    setUser(null);
    setRole(null);
  }

  async function refreshProfile() {
    const u: any = await apiMe(); // 401 → catch
    setUser(u);
    setRole(normalizeRole(u?.role));
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

        if (data?.user) setUser(data.user);
        if (data?.role) setRole(normalizeRole(data.role));

        await refreshProfile();
      },

      register: async (payload) => {
        await apiRegister(payload);
        await apiLogin(payload.email, payload.password);
        await refreshProfile();
      },

      logout: async () => {
        try {
          await apiLogout(); // backend briše HttpOnly cookie
        } catch {
          // ignoriši
        } finally {
          clearAuth(); // ← OVO TE IZLOGUJE
        }
      },

      refreshProfile,
    }),
    [user, role, loading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth mora biti unutar <AuthProvider>");
  }
  return ctx;
}
