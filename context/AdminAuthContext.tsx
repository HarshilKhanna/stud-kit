"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";
const ADMIN_AUTH_KEY = "admin_authenticated";

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  authReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthenticated(window.sessionStorage.getItem(ADMIN_AUTH_KEY) === "true");
      window.localStorage.removeItem(ADMIN_AUTH_KEY);
    }
    setAuthReady(true);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
      window.localStorage.removeItem(ADMIN_AUTH_KEY);
    }
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, authReady, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
