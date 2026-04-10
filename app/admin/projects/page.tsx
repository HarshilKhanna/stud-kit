"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useProject } from "@/context/ProjectContext";
import type { Project } from "@/types";

export default function AdminProjectsPage() {
  const { projects, setActiveProject, loading } = useProject();
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
      <div className="mb-6">
        <h1
          className="text-3xl font-bold leading-none text-neutral-900"
          style={{ fontFamily: "var(--font-serif, serif)" }}
        >
          Kits.
        </h1>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          Switch the active kit — items are scoped per catalogue in Firebase.
        </p>
      </div>

      {loading ? (
        <p className="py-16 text-center text-[11px] uppercase tracking-[0.1em] text-neutral-500">
          Loading kits…
        </p>
      ) : sorted.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600">No kits yet</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-neutral-500">
            Add kits in Firestore or run your seed script.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
          {sorted.map((p) => {
            const busy = pendingId === p.id;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    {p.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    {p.slug}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={p.isActive || busy}
                  onClick={() => void handleSetActive(p)}
                  className={`shrink-0 border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-default ${
                    p.isActive
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  }`}
                >
                  {busy ? "Switching…" : p.isActive ? "Active" : "Use this kit"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
