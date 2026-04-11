"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X } from "lucide-react";
import type {
  AccommodationType,
  ArrivalTiming,
  BudgetTier,
  Region,
  StudentProfile,
} from "@/types";
import {
  REGION_OPTIONS,
  ACCOMMODATION_OPTIONS,
  ARRIVAL_OPTIONS,
  BUDGET_OPTIONS,
} from "@/lib/studentUiMeta";
import { useData } from "@/context/DataContext";

const DISMISS_KEY = "studentkit_onboarding_dismissed";

interface StudentProfileModalProps {
  /** When true, opens automatically once (first visit) if no profile */
  autoOpenWhenEmpty?: boolean;
}

export function StudentProfileModal({ autoOpenWhenEmpty }: StudentProfileModalProps) {
  const {
    studentProfile,
    setStudentProfile,
    profileModalOpen,
    openProfileModal,
    closeProfileModal,
    hydrated,
  } = useData();

  const [step, setStep] = useState(1);
  const [region, setRegion] = useState<Region | "">("");
  const [accommodation, setAccommodation] = useState<AccommodationType | "">("");
  const [arrivalTiming, setArrivalTiming] = useState<ArrivalTiming | "">("");
  const [budget, setBudget] = useState<BudgetTier | "">("");
  const [regionQuery, setRegionQuery] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);

  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return REGION_OPTIONS;
    return REGION_OPTIONS.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.searchText.toLowerCase().includes(q) ||
        r.chip.toLowerCase().includes(q),
    );
  }, [regionQuery]);

  useEffect(() => {
    if (!hydrated || !autoOpenWhenEmpty) return;
    if (studentProfile != null) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    openProfileModal();
  }, [hydrated, autoOpenWhenEmpty, studentProfile, openProfileModal]);

  useEffect(() => {
    if (!profileModalOpen) return;
    if (studentProfile) {
      setRegion(studentProfile.region);
      setAccommodation(studentProfile.accommodation);
      setArrivalTiming(studentProfile.arrivalTiming);
      setBudget(studentProfile.budget);
    } else {
      setRegion("");
      setAccommodation("");
      setArrivalTiming("");
      setBudget("");
    }
    setStep(1);
    setRegionQuery("");
    setRegionOpen(false);
  }, [profileModalOpen, studentProfile]);

  const handleDismiss = () => {
    if (studentProfile == null) {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    closeProfileModal();
  };

  const canNext = () => {
    if (step === 1) return Boolean(region);
    if (step === 2) return Boolean(accommodation);
    if (step === 3) return Boolean(arrivalTiming);
    if (step === 4) return Boolean(budget);
    return false;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    if (!region || !accommodation || !arrivalTiming || !budget) return;
    const profile: StudentProfile = {
      region,
      accommodation,
      arrivalTiming,
      budget,
    };
    setStudentProfile(profile);
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    closeProfileModal();
  };

  const regionLabel =
    REGION_OPTIONS.find((r) => r.id === region)?.label ?? "Choose region";

  return (
    <AnimatePresence>
      {profileModalOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleDismiss();
          }}
        >
          <motion.div
            className="relative w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drag handle visible on mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-neutral-100 px-6 pb-4 pt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                Step {step} of 4
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                {step === 1 && "Where are you headed?"}
                {step === 2 && "Where will you live?"}
                {step === 3 && "When do you arrive?"}
                {step === 4 && "What is your budget?"}
              </h2>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-5 py-4 sm:max-h-[min(60vh,420px)] sm:px-6 sm:py-5">
              {step === 1 && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={regionQuery}
                      onChange={(e) => setRegionQuery(e.target.value)}
                      onFocus={() => setRegionOpen(true)}
                      placeholder="Search region…"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegionOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-sm text-neutral-800"
                  >
                    <span className={region ? "" : "text-neutral-400"}>
                      {region ? regionLabel : "Or pick from list"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 transition-transform ${regionOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {(regionOpen || regionQuery) && (
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50 p-1">
                      {filteredRegions.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setRegion(r.id);
                              setRegionOpen(false);
                              setRegionQuery("");
                            }}
                            className={[
                              "w-full rounded-lg px-3 py-2 text-left text-xs text-neutral-700 transition-colors",
                              region === r.id
                                ? "bg-white font-medium shadow-sm"
                                : "hover:bg-white",
                            ].join(" ")}
                          >
                            {r.label}
                          </button>
                        </li>
                      ))}
                      {filteredRegions.length === 0 && (
                        <li className="px-3 py-2 text-xs text-neutral-400">
                          No matches.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ACCOMMODATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccommodation(opt.id)}
                      className={[
                        "rounded-xl border px-3 py-3 text-left text-xs font-semibold transition-all",
                        accommodation === opt.id
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-2">
                  {ARRIVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setArrivalTiming(opt.id)}
                      className={[
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        arrivalTiming === opt.id
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBudget(opt.id)}
                      className={[
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        budget === opt.id
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-500 hover:text-neutral-800"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                disabled={!canNext()}
                onClick={handleNext}
                className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step < 4 ? "Next" : "Get My List →"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
