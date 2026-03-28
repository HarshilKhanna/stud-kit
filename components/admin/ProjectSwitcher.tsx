"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

interface ProjectSwitcherProps {
  onClose?: () => void;
}

function statusDotClass(isActive: boolean): string {
  if (isActive) return "bg-emerald-500";
  return "bg-neutral-400";
}

export function ProjectSwitcher({ onClose }: ProjectSwitcherProps) {
  const { projects, activeProject, setActiveProject, loading } = useProject();
  const [open, setOpen] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!flashMsg) return;
    const id = setTimeout(() => setFlashMsg(null), 1600);
    return () => clearTimeout(id);
  }, [flashMsg]);

  return (
    <div ref={rootRef} className="relative px-3 pt-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between rounded-full border px-3 py-1.5 text-left text-xs font-normal text-neutral-700 transition-colors hover:bg-white"
        style={{ borderColor: "#E5E2DC", backgroundColor: "#F5F3EF" }}
      >
        <span className="truncate">
          {loading ? "Loading projects..." : activeProject?.name ?? "Select project"}
        </span>
        <ChevronDown
          className={`ml-2 h-3.5 w-3.5 flex-shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-3 right-3 top-[calc(100%-2px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
          role="menu"
        >
          <div className="max-h-56 overflow-y-auto py-1.5">
            {projects.map((project) => {
              const isActive = activeProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    void setActiveProject(project);
                    setFlashMsg(`Switched to ${project.name}`);
                    setOpen(false);
                    onClose?.();
                  }}
                  className={`relative flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-neutral-50 text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#1a1a1a]" />
                  )}
                  <span className={`truncate pr-2 ${isActive ? "font-semibold" : "font-normal"}`}>
                    {project.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(project.isActive)}`} />
                    <span>{project.isActive ? "active" : "inactive"}</span>
                  </span>
                </button>
              );
            })}
            {!loading && projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-neutral-400">No projects found.</p>
            )}
          </div>
        </div>
      )}
      {flashMsg && (
        <p className="mt-1 px-2 text-[11px] text-neutral-500">{flashMsg}</p>
      )}
    </div>
  );
}
