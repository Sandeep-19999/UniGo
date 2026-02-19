import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/axios";

const AuthContext = createContext(null);
const TOKEN_KEY = "unigo_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setLoading(false);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        return data.user;
      } catch {
        logout();
        return null;
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    return inFlight.current;
  }, [logout]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, role, adminInviteCode) => {
    const { data } = await api.post("/auth/register", { name, email, password, role, adminInviteCode });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshMe }), [user, loading, login, register, logout, refreshMe]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
