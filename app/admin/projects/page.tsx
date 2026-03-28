"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useProject } from "@/context/ProjectContext";
import type { Project } from "@/types";

export default function AdminProjectsPage() {
  const { projects, activeProject, setActiveProject, loading } = useProject();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sorted = useMemo(() => [...projects], [projects]);

  const handleSetActive = async (project: Project) => {
    if (project.isActive) return;
    setPendingId(project.id);
    try {
      await setActiveProject(project);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AdminShell>
      <div className="mb-5">
        <h1 className="text-base font-medium text-neutral-900">Projects</h1>
        <p className="mt-0.5 text-xs font-light text-neutral-400">
          Switch the active catalogue project. Items are scoped per project in Firebase.
        </p>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading projects…</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">No projects yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Add projects in Firestore or run your seed script so they appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {sorted.map((p) => {
            const isActive = activeProject?.id === p.id;
            const busy = pendingId === p.id;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                  <p className="truncate text-xs text-neutral-400">{p.slug}</p>
                </div>
                <button
                  type="button"
                  disabled={p.isActive || busy}
                  onClick={() => void handleSetActive(p)}
                  className="shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-default disabled:opacity-50"
                >
                  {busy ? "Switching…" : p.isActive ? "Active" : "Set active"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
