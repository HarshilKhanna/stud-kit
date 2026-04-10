"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

export function ProjectSwitcher({ onClose }: { onClose?: () => void }) {
  const { projects, activeProject, setActiveProject, loading } = useProject();
  const [open, setOpen]           = useState(false);
  const [flashMsg, setFlashMsg]   = useState<string | null>(null);
  const rootRef                   = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!flashMsg) return;
    const id = setTimeout(() => setFlashMsg(null), 1500);
    return () => clearTimeout(id);
  }, [flashMsg]);

  return (
    <div ref={rootRef} className="relative border-b border-neutral-100 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border border-neutral-200 bg-neutral-50 px-3 py-2 text-left transition-colors hover:bg-white"
        style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
      >
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          {loading ? "Loading…" : (activeProject?.name ?? "Select kit")}
        </span>
        <ChevronDown
          className={`ml-2 h-3 w-3 flex-shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-20 border border-neutral-200 bg-white shadow-lg">
          <div className="max-h-52 overflow-y-auto py-1">
            {projects.map((project) => {
              const isActive = activeProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    void setActiveProject(project);
                    setFlashMsg(`Now showing: ${project.name}`);
                    setOpen(false);
                    onClose?.();
                  }}
                  className={[
                    "relative flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors",
                    isActive
                      ? "bg-neutral-50 font-semibold text-black"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-black",
                  ].join(" ")}
                >
                  {isActive && (
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 bg-black" />
                  )}
                  <span className="truncate uppercase tracking-[0.12em]">{project.name}</span>
                  <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-neutral-400">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${project.isActive ? "bg-black" : "bg-neutral-300"}`}
                    />
                    {project.isActive ? "active" : "inactive"}
                  </span>
                </button>
              );
            })}
            {!loading && projects.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-neutral-500">No kits found.</p>
            )}
          </div>
        </div>
      )}

      {flashMsg && (
        <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">{flashMsg}</p>
      )}
    </div>
  );
}
