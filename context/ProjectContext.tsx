"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "@/types";
import { getProjects, setOnlyActiveProject } from "@/lib/firestore";

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  setActiveProject: (project: Project) => Promise<void>;
  refreshProjects: () => void;
  patchProjectOptimistic: (id: string, updates: Partial<Project>) => void;
  removeProjectOptimistic: (id: string) => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(() => {
    setLoading(true);
    getProjects()
      .then((list) => {
        setProjects(list);
        const preferredId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem("admin_active_project_id")
            : null;

        setActiveProjectState((prev) => {
          const active = list.find((p) => p.isActive) ?? null;
          if (active) return active;
          if (preferredId) {
            const preferred = list.find((p) => p.id === preferredId);
            if (preferred) return preferred;
          }
          if (prev) {
            const updatedPrev = list.find((p) => p.id === prev.id);
            if (updatedPrev) return updatedPrev;
          }
          return list[0] ?? null;
        });
      })
      .catch((err) => {
        console.error("Project fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const refreshProjects = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  const setActiveProject = useCallback(
    async (project: Project) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("admin_active_project_id", project.id);
      }
      setActiveProjectState(project);
      setProjects((prev) =>
        prev.map((p) => ({ ...p, isActive: p.id === project.id })),
      );
      try {
        await setOnlyActiveProject(project.id);
        loadProjects();
      } catch (err) {
        console.error("Failed to persist active project:", err);
        loadProjects();
        throw err;
      }
    },
    [loadProjects],
  );

  const patchProjectOptimistic = useCallback(
    (id: string, updates: Partial<Project>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
      setActiveProjectState((prev) =>
        prev && prev.id === id ? { ...prev, ...updates } : prev,
      );
    },
    [],
  );

  const removeProjectOptimistic = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProjectState((prev) => (prev?.id === id ? null : prev));
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        setActiveProject,
        refreshProjects,
        patchProjectOptimistic,
        removeProjectOptimistic,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside <ProjectProvider>");
  return ctx;
}
