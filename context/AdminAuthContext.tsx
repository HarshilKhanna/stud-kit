"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getProjects } from "@/lib/firestore";

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
    try {
      const projects = await getProjects();
      const matchedProject = projects.find(
        (p) => p.adminUsername === username && p.adminPassword === password,
      );
      if (matchedProject) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("admin_active_project_id", matchedProject.id);
          window.sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
        }
        setIsAuthenticated(true);
        return true;
      }

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const preferredProject = projects.find((p) => p.isActive) ?? projects[0] ?? null;
        if (typeof window !== "undefined") {
          if (preferredProject) {
            window.sessionStorage.setItem("admin_active_project_id", preferredProject.id);
          } else {
            window.sessionStorage.removeItem("admin_active_project_id");
          }
          window.sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
        }
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      console.error("Admin login failed:", err);
      return false;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("admin_active_project_id");
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
