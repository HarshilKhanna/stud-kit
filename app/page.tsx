"use client";

import { useState, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Newsreader, Manrope } from "next/font/google";
import { ArrowRight } from "lucide-react";
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

/* ─── Fonts ─────────────────────────────────────────── */
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
  adjustFontFallback: false,
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

/* ─── Types & constants ──────────────────────────────── */
type StepKey = "region" | "accommodation" | "arrival" | "budget";
const STEPS: StepKey[] = ["region", "accommodation", "arrival", "budget"];
const LAST = STEPS.length - 1;

const STEP_META: Record<StepKey, { label: string; question: string }> = {
  region:        { label: "Destination Selection",  question: "Where will your academic journey take place?" },
  accommodation: { label: "Accommodation Detail",   question: "What is your living situation?" },
  arrival:       { label: "Arrival Timing",         question: "When do you make the move?" },
  budget:        { label: "Budget Allocation",      question: "What is your budget range?" },
};

interface Answers {
  region?: Region;
  accommodation?: AccommodationType;
  arrival?: ArrivalTiming;
  budget?: BudgetTier;
}

function getLabelForAnswer(step: StepKey, value: string): string {
  if (step === "region")        return REGION_OPTIONS.find((r) => r.id === value)?.chip ?? value;
  if (step === "accommodation") return ACCOMMODATION_OPTIONS.find((o) => o.id === value)?.label ?? value;
  if (step === "arrival")       return ARRIVAL_OPTIONS.find((o) => o.id === value)?.label ?? value;
  return BUDGET_OPTIONS.find((o) => o.id === value)?.label ?? value;
}

/* ─── Page ───────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const { setStudentProfile, hydrated } = useData();
  const onboardingRef = useRef<HTMLElement>(null);

  const [stepIdx, setStepIdx]     = useState(0);
  const [answers, setAnswers]     = useState<Answers>({});
  const [, setDirection] = useState(1);

  const currentStep = STEPS[stepIdx];
  const stepNum     = stepIdx + 1;
  const lockedSteps = STEPS.slice(stepIdx + 1);
  const isLastStep  = stepIdx === LAST;

  function scrollToOnboarding() {
    onboardingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectedForStep(step: StepKey): string | undefined {
    if (step === "region")        return answers.region;
    if (step === "accommodation") return answers.accommodation;
    if (step === "arrival")       return answers.arrival;
    if (step === "budget")        return answers.budget;
  }

  function jumpToStep(idx: number) {
    setDirection(idx < stepIdx ? -1 : 1);
    setStepIdx(idx);
  }

  function selectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
    const eventMap: Record<string, string> = {
      region:        "region_selected",
      accommodation: "accommodation_selected",
      arrival:       "arrival_selected",
      budget:        "budget_selected",
    };
    trackEvent(eventMap[currentStep] ?? currentStep, { value });
    if (!isLastStep) {
      setTimeout(() => {
        setDirection(1);
        setStepIdx((i) => i + 1);
      }, 320);
    }
  }

  function handleGetMyKit() {
    const a = answers;
    if (!a.region || !a.accommodation || !a.arrival || !a.budget) return;
    const profile: StudentProfile = {
      region:        a.region,
      accommodation: a.accommodation,
      arrivalTiming: a.arrival,
      budget:        a.budget,
    };
    trackEvent("kit_generated", { region: a.region, accommodation: a.accommodation, arrival: a.arrival, budget: a.budget });
    setStudentProfile(profile);
    router.push("/browse");
  }

  function getOptions() {
    if (currentStep === "region")        return REGION_OPTIONS.map((r) => ({ id: r.id, label: r.chip }));
    if (currentStep === "accommodation") return ACCOMMODATION_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
    if (currentStep === "arrival")       return ARRIVAL_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
    return BUDGET_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
      </div>
    );
  }

  const options        = getOptions();
  const selected       = selectedForStep(currentStep);
  const completedSteps = STEPS.slice(0, stepIdx).filter((s) => selectedForStep(s));
  // Use 2-column grid when there are 4+ options (fits all on screen without scrolling)
  const use2Col        = options.length >= 4;

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen overflow-x-hidden bg-[#F9F9F9] text-[#1a1c1c]`}
      style={{ fontFamily: "var(--font-sans), Manrope, sans-serif" }}
    >

      {/* ══════════════════ NAV ══════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.04] bg-[#F9F9F9]/90 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 md:px-10 md:py-5">
          <span
            className="text-sm font-bold tracking-tighter text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            STUDENTKIT
          </span>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════
          min-h-dvh: hero fills exactly the viewport — onboarding cannot peek below the fold.
      ══════════════════════════════════════════ */}
      <section className="relative flex min-h-dvh flex-col justify-center overflow-hidden">
        {/* Right-half background tint */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-[52%]"
          style={{ background: "radial-gradient(ellipse at 70% 50%, #E8E8E8 0%, #F0F0F0 45%, transparent 75%)" }}
        />

        <div className="mx-auto grid w-full max-w-[1200px] items-center px-5 py-16 md:grid-cols-[1fr_1px_1fr] md:px-8 md:py-20 lg:px-12">

          {/* Left — headline + stats + CTA */}
          <div className="relative z-10 min-w-0 md:pr-12">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400"
            >
              The Academic Monograph · 2026 Edition
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 font-semibold tracking-tighter text-black"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2rem, 6vw, 4rem)",
                lineHeight: "1.05",
              }}
            >
              The essential move-in kit for Indian students.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 max-w-sm text-base leading-relaxed text-neutral-500"
            >
              Plan your essentials before moving into hostel life. Every item, sourced and prioritised for your destination.
            </motion.p>

            {/* Stats row — flex-wrap so nothing clips at any width */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 border-t border-b border-neutral-200 py-3.5"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { value: "120+", label: "Curated items" },
                  { value: "20+",  label: "Cities covered" },
                  { value: "4",    label: "Quick questions" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span
                      className="text-xl font-bold leading-none text-black"
                      style={{ fontFamily: "var(--font-serif), serif" }}
                    >
                      {value}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA — the last visible element in the hero before scrolling */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-stretch gap-2 sm:items-start"
            >
              <button
                onClick={scrollToOnboarding}
                className="w-full rounded-full bg-black px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-neutral-800 active:scale-[0.98] sm:w-auto"
                style={{ minHeight: "52px" }}
              >
                Start planning →
              </button>
              <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                Takes 2 mins · 4 quick questions
              </p>
            </motion.div>
          </div>

          {/* Vertical divider — desktop only */}
          <div className="relative hidden self-stretch md:block">
            <div
              className="absolute left-0 top-[4%] h-[92%] w-px"
              style={{ background: "linear-gradient(to bottom, transparent, #AEAEAE 15%, #AEAEAE 85%, transparent)" }}
            />
          </div>

          {/* Right — decorative card, desktop only */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden cursor-default md:flex md:items-center md:justify-center md:pl-12"
          >
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-full max-w-[460px] border border-neutral-200 bg-white p-11 shadow-[0_6px_36px_rgba(0,0,0,0.09)]"
            >
              <div className="space-y-6">
                <div className="border-b border-neutral-200 pb-4">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    Category 01
                  </span>
                  <span className="text-2xl italic text-black" style={{ fontFamily: "var(--font-serif), serif" }}>
                    Bedding &amp; Linens
                  </span>
                </div>
                <div className="space-y-3.5">
                  {[
                    { label: "Duvet Cover (Cotton)", checked: true },
                    { label: "Pillowcase Set ×2",    checked: true },
                    { label: "Fitted Sheet (King)",   checked: true },
                    { label: "Mattress Protector",    checked: false },
                    { label: "Thermal Blanket",       checked: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <span className={`text-sm leading-none ${item.checked ? "text-neutral-900" : "text-neutral-400"}`}>
                        {item.label}
                      </span>
                      <div
                        className={`h-[16px] w-[16px] flex-shrink-0 rounded-[3px] border-2 transition-colors ${
                          item.checked ? "border-black bg-black" : "border-neutral-300"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-100 pt-4">
                  <div className="mb-2 flex justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Progress</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">3 / 5</p>
                  </div>
                  <div className="h-[3px] w-full bg-neutral-100">
                    <div className="h-full bg-black" style={{ width: "60%" }} />
                  </div>
                </div>
                <span className="block text-xl italic text-neutral-300" style={{ fontFamily: "var(--font-serif), serif" }}>
                  The Monograph.
                </span>
              </div>
            </motion.div>
            <div className="absolute -right-4 -top-4 -z-10 h-36 w-36 bg-[#E2E2E2]" />
            <div className="absolute -bottom-4 -left-4 -z-10 h-20 w-20 bg-[#EBEBEB]" />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ ONBOARDING ══════════════════
          scroll-mt-14 accounts for the sticky nav height when scrollIntoView fires.
      ══════════════════════════════════════════════════ */}
      <section
        id="onboarding"
        ref={onboardingRef}
        className="scroll-mt-14 bg-[#F3F3F3]"
      >
        <div className="mx-auto max-w-3xl px-5 pt-6 pb-10 md:px-8 md:pt-10 md:pb-16">

          {/* Completed-step breadcrumbs — appear above card, outside fixed-height area */}
          {completedSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              {completedSteps.map((step, i) => {
                const val = selectedForStep(step);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => jumpToStep(i)}
                    className="flex min-h-[44px] items-center gap-2 border border-neutral-300 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:border-black hover:text-black"
                  >
                    <span className="text-neutral-300">{String(i + 1).padStart(2, "0")}</span>
                    {val ? getLabelForAnswer(step, val) : "—"}
                    <span className="text-neutral-300">✕</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* ── Fixed-height onboarding card ──────────────────────────────────
              Mobile (<640px): h-dvh — fills the screen, feels like its own page.
              Tablet (640px+): h-[500px] — stable, no layout shift between steps.
              Desktop (768px+): h-[480px].
              overflow-hidden clips the slide animation cleanly.
          ──────────────────────────────────────────────────────────────────── */}
          <div className="overflow-hidden border border-neutral-200/60 bg-white">
            <div className="flex flex-col p-5 sm:p-8">

              {/* Card header: "Onboarding" title + step counter + progress bar */}
              <div className="mb-4 flex flex-shrink-0 items-center justify-between border-b border-neutral-200/40 pb-4">
                <h2
                  className="font-normal tracking-tight text-black"
                  style={{ fontFamily: "var(--font-serif), serif", fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}
                >
                  Onboarding
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    {String(stepNum).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </span>
                  <div className="relative h-px w-16 bg-neutral-200 sm:w-24">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-black"
                      animate={{ width: `${(stepNum / STEPS.length) * 100}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 28 }}
                    />
                  </div>
                </div>
              </div>

              {/* Animated question area */}
              <div className="overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-4 sm:gap-5"
                  >
                    {/* Question label + text */}
                    <div className="flex-shrink-0">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        {STEP_META[currentStep].label}
                      </span>
                      <h3
                        className="leading-snug text-black"
                        style={{
                          fontFamily: "var(--font-serif), serif",
                          fontSize: "clamp(1.1rem, 3.5vw, 1.75rem)",
                          lineHeight: "1.25",
                        }}
                      >
                        {STEP_META[currentStep].question}
                      </h3>
                    </div>

                    {/* Option buttons
                        4+ options → 2-column grid (all visible without scrolling on mobile).
                        <4 options → single column.
                        Arrow hidden on mobile in 2-col to maximise label space.
                    */}
                    <div
                      className="flex-shrink-0"
                      style={{
                        display: "grid",
                        gridTemplateColumns: use2Col ? "1fr 1fr" : "1fr",
                        gap: "8px",
                      }}
                    >
                      {options.map((opt) => {
                        const isActive = selected === opt.id;
                        return (
                          <motion.button
                            key={opt.id}
                            type="button"
                            onClick={() => selectOption(opt.id)}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                            className={[
                              "flex items-center justify-between overflow-hidden rounded-xl border px-3 text-left transition-colors duration-150 sm:px-4",
                              isActive
                                ? "border-black bg-black text-white"
                                : "border-neutral-200 bg-neutral-100 text-neutral-800 hover:border-neutral-400",
                            ].join(" ")}
                            style={{ height: "44px", fontSize: "14px" }}
                          >
                            <span className="truncate font-medium">{opt.label}</span>
                            {/* Arrow: hidden in 2-col on mobile, visible on sm+ or in 1-col */}
                            <ArrowRight
                              className={[
                                "ml-1 h-3.5 w-3.5 flex-shrink-0 transition-opacity",
                                isActive ? "opacity-80" : "opacity-30",
                                use2Col ? "hidden sm:block" : "",
                              ].join(" ")}
                            />
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Final step confirm — appears inside the fixed card */}
                    {isLastStep && selected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex-shrink-0 border-t border-neutral-100 pt-4"
                      >
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                          Review your selections above — then confirm.
                        </p>
                        <button
                          type="button"
                          onClick={handleGetMyKit}
                          className="w-full rounded-full bg-black py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 active:scale-[0.98] sm:w-auto sm:px-10"
                          style={{ minHeight: "52px" }}
                        >
                          Get my kit →
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Remaining locked steps — below card, visible after scrolling past on mobile */}
          {lockedSteps.length > 0 && (
            <div className="mt-3 space-y-2">
              {lockedSteps.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.22 }}
                  className="flex items-center justify-between bg-[#EEEEEE] px-5 py-3.5 opacity-50"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    Step {String(stepIdx + 2 + i).padStart(2, "0")}: {STEP_META[step].label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Locked</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ FEATURE GRID ══════════════════ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-24 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-10 md:gap-12 lg:grid-cols-[7fr_5fr]">

            {/* Left col */}
            <div className="space-y-8">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="font-semibold tracking-tighter"
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
                  lineHeight: "1.1",
                }}
              >
                Curated for the Indian Diaspora.
              </motion.h2>
              <p className="max-w-lg text-base leading-relaxed text-neutral-500 md:text-lg">
                We understand the specific needs of moving from India — from pressure cookers to heavy-duty winter wear that fits international standards.
              </p>
              <div className="relative h-[300px] w-full overflow-hidden bg-[#EEEEEE] md:h-[360px]">
                <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                    Curated Essentials — 2026
                  </p>
                  <div className="space-y-4">
                    {[
                      { cat: "Bedding & Linens",    count: "12 items" },
                      { cat: "Kitchen Essentials",  count: "08 items" },
                      { cat: "Documents & Admin",   count: "06 items" },
                    ].map(({ cat, count }) => (
                      <div key={cat} className="flex items-baseline justify-between border-b border-neutral-300/40 pb-3">
                        <span className="text-lg italic text-neutral-700 md:text-xl" style={{ fontFamily: "var(--font-serif), serif" }}>
                          {cat}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xl italic text-neutral-300 md:text-3xl" style={{ fontFamily: "var(--font-serif), serif" }}>
                    The Monograph.
                  </p>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="flex flex-col gap-6 md:gap-8 lg:pt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-black p-6 text-white md:p-8 lg:p-10"
              >
                <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Toolkit 01
                </span>
                <h3
                  className="mb-4"
                  style={{ fontFamily: "var(--font-serif), serif", fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
                >
                  The Checklist.
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  A dynamic list that evolves based on your university&apos;s specific requirements and city climate. Filter by priority, source, and budget — then pack with confidence.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#EEEEEE] p-6 md:p-8 lg:p-10"
              >
                <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Toolkit 02
                </span>
                <h3
                  className="mb-4"
                  style={{ fontFamily: "var(--font-serif), serif", fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
                >
                  The Sourcing.
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">
                  Each item is tagged by where to buy it — bring from India or purchase locally. Know exactly what to pack before you board, and what to buy when you arrive.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="border-t border-black/10 bg-[#F3F3F3]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-5 py-8 md:flex-row md:px-8 md:py-10 lg:px-12">
          <div>
            <div className="mb-1.5 text-sm font-bold tracking-tighter" style={{ fontFamily: "var(--font-serif), serif" }}>
              STUDENTKIT
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              © 2026 STUDENTKIT. THE ACADEMIC MONOGRAPH.
            </div>
          </div>
          <div className="flex gap-8">
            {["Terms", "Privacy", "Archive"].map((link) => (
              <a key={link} href="#" className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
