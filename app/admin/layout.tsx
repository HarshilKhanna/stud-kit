"use client";

import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ProjectProvider } from "@/context/ProjectContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ProjectProvider>{children}</ProjectProvider>
    </AdminAuthProvider>
  );
}
