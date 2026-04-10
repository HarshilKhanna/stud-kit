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
  const formRef = useRef<HTMLDivElement>(null);

  const [stepIdx, setStepIdx]     = useState(0);
  const [answers, setAnswers]     = useState<Answers>({});
  const [direction, setDirection] = useState(1);

  const currentStep = STEPS[stepIdx];
  const stepNum     = stepIdx + 1;
  const lockedSteps = STEPS.slice(stepIdx + 1);
  const isLastStep  = stepIdx === LAST;

  /* ── helpers ── */
  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    // Track each step individually
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
      }, 300);
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

  /* ── loading ── */
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
      </div>
    );
  }

  const options  = getOptions();
  const selected = selectedForStep(currentStep);
  const completedSteps = STEPS.slice(0, stepIdx).filter((s) => selectedForStep(s));

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#F9F9F9] text-[#1a1c1c]`}
      style={{ fontFamily: "var(--font-sans), Manrope, sans-serif" }}
    >

      {/* ══════════════════ NAV ══════════════════ */}
      <nav className="sticky top-0 z-50 flex items-center bg-[#F9F9F9]/90 backdrop-blur-sm border-b border-black/[0.04] px-8 py-5">
        <span
          className="text-xl font-bold tracking-tighter"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          STUDENTKIT
        </span>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative grid min-h-[88vh] items-center px-8 py-16 md:grid-cols-[1fr_1px_1fr] md:gap-0 md:px-14 lg:px-20">

        {/* Right-half background tint — stronger */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-[52%]"
          style={{ background: "radial-gradient(ellipse at 70% 50%, #E8E8E8 0%, #F0F0F0 45%, transparent 75%)" }}
        />

        {/* Left — headline + stats + CTAs */}
        <div className="relative z-10 pr-0 md:pr-12">
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
            className="mb-4 text-5xl font-semibold leading-[0.93] tracking-tighter text-black md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            The essential move-in kit for Indian students.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 max-w-sm text-base leading-relaxed text-neutral-500"
          >
            Plan your essentials before moving into hostel life. Every item, sourced and prioritised for your destination.
          </motion.p>

          {/* Stats row — horizontal anchor */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 flex items-center gap-0 border-t border-b border-neutral-200 py-3.5"
          >
            {[
              { value: "120+", label: "Curated items" },
              { value: "20+",  label: "Cities covered" },
              { value: "4",    label: "Quick questions" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`flex items-baseline gap-2 px-5 ${i > 0 ? "border-l border-neutral-200" : "pl-0"}`}>
                <span
                  className="text-[22px] font-bold leading-none text-black"
                  style={{ fontFamily: "var(--font-serif), serif" }}
                >
                  {value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA — button + hint as one unit */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-1.5"
          >
            <button
              onClick={scrollToForm}
              className="rounded-full bg-black px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start planning →
            </button>
            <p className="pl-1 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              Takes 2 mins · 4 quick questions
            </p>
          </motion.div>
        </div>

        {/* Vertical divider — layout anchor */}
        <div className="relative hidden self-stretch md:block">
          <div
            className="absolute left-0 top-[4%] h-[92%] w-px"
            style={{ background: "linear-gradient(to bottom, transparent, #AEAEAE 15%, #AEAEAE 85%, transparent)" }}
          />
        </div>

        {/* Right — decorative card */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden cursor-default pl-0 md:flex md:items-center md:justify-center md:pl-12"
        >
          <motion.div
            whileHover={{ scale: 1.025, y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-[460px] border border-neutral-200 bg-white p-11 shadow-[0_6px_36px_rgba(0,0,0,0.09)]"
          >
            <div className="space-y-6">
              {/* Category header */}
              <div className="border-b border-neutral-200 pb-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Category 01
                </span>
                <span
                  className="text-2xl italic text-black"
                  style={{ fontFamily: "var(--font-serif), serif" }}
                >
                  Bedding &amp; Linens
                </span>
              </div>
              {/* Checklist items */}
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
              {/* Progress */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="mb-2 flex justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Progress</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">3 / 5</p>
                </div>
                <div className="h-[3px] w-full bg-neutral-100">
                  <div className="h-full bg-black" style={{ width: "60%" }} />
                </div>
              </div>
              {/* Brand mark */}
              <span
                className="block text-xl italic text-neutral-300"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                The Monograph.
              </span>
            </div>
          </motion.div>

          {/* Decorative offset blocks */}
          <div className="absolute -right-4 -top-4 -z-10 h-36 w-36 bg-[#E2E2E2]" />
          <div className="absolute -bottom-4 -left-4 -z-10 h-20 w-20 bg-[#EBEBEB]" />
        </motion.div>
      </section>

      {/* ══════════════════ ONBOARDING ══════════════════ */}
      <section ref={formRef} className="scroll-mt-[72px] bg-[#F3F3F3] px-8 py-16">
        <div className="mx-auto max-w-3xl">

          {/* Editorial header */}
          <div className="mb-8 flex items-baseline justify-between border-b border-neutral-300/30 pb-4">
            <h2
              className="text-3xl tracking-tight"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Onboarding
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Step {String(stepNum).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <div className="relative h-px w-28 bg-neutral-300">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-black"
                  animate={{ width: `${(stepNum / STEPS.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 28 }}
                />
              </div>
            </div>
          </div>

          {/* Previous answers breadcrumb */}
          {completedSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              {completedSteps.map((step, i) => {
                const val = selectedForStep(step);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => jumpToStep(i)}
                    className="flex items-center gap-2 border border-neutral-300 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:border-black hover:text-black"
                  >
                    <span className="text-neutral-300">{String(i + 1).padStart(2, "0")}</span>
                    {val ? getLabelForAnswer(step, val) : "—"}
                    <span className="text-neutral-300">✕</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Form card — fixed height prevents layout shift */}
          <div
            className="overflow-hidden border border-neutral-200/50 bg-white p-8 md:p-12"
            style={{ minHeight: 380 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: direction * 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -36 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                {/* Question */}
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    {STEP_META[currentStep].label}
                  </span>
                  <h3
                    className="max-w-xl text-3xl leading-tight md:text-4xl"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {STEP_META[currentStep].question}
                  </h3>
                </div>

                {/* Option buttons */}
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {options.map((opt) => {
                    const isActive = selected === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        onClick={() => selectOption(opt.id)}
                        whileHover={{ scale: 1.012 }}
                        whileTap={{ scale: 0.988 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-150",
                          isActive
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 bg-[#F3F3F3] text-neutral-800 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        <ArrowRight
                          className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${isActive ? "opacity-80" : "opacity-30"}`}
                        />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Final step confirm button */}
                {isLastStep && selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-neutral-100 pt-6"
                  >
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                      Review your selections above — then confirm.
                    </p>
                    <button
                      type="button"
                      onClick={handleGetMyKit}
                      className="rounded-full bg-black px-10 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Get my kit →
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* All remaining locked steps */}
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
      <section className="overflow-hidden px-8 py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8">

          {/* Left col — headline + editorial image */}
          <div className="col-span-12 space-y-10 md:col-span-7">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl leading-tight tracking-tighter md:text-7xl"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Curated for the Indian Diaspora.
            </motion.h2>
            <p className="max-w-lg text-lg leading-relaxed text-neutral-500">
              We understand the specific needs of moving from India — from pressure cookers to heavy-duty winter wear that fits international standards.
            </p>
            {/* Editorial image */}
            <div className="relative h-[360px] w-full overflow-hidden bg-[#EEEEEE]">
              <div className="absolute inset-0 flex flex-col justify-between p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                  Curated Essentials — 2026
                </p>
                <div className="space-y-4">
                  {[
                    { cat: "Bedding & Linens", count: "12 items" },
                    { cat: "Kitchen Essentials", count: "08 items" },
                    { cat: "Documents & Admin", count: "06 items" },
                  ].map(({ cat, count }) => (
                    <div key={cat} className="flex items-baseline justify-between border-b border-neutral-300/40 pb-3">
                      <span className="text-xl italic text-neutral-700" style={{ fontFamily: "var(--font-serif), serif" }}>
                        {cat}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-3xl italic text-neutral-300" style={{ fontFamily: "var(--font-serif), serif" }}>
                  The Monograph.
                </p>
              </div>
            </div>
          </div>

          {/* Right col — informational toolkit cards */}
          <div className="col-span-12 flex flex-col gap-8 md:col-span-5 md:pt-48">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-black p-10 text-white"
            >
              <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Toolkit 01
              </span>
              <h3 className="mb-4 text-4xl" style={{ fontFamily: "var(--font-serif), serif" }}>
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
              className="bg-[#EEEEEE] p-10"
            >
              <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Toolkit 02
              </span>
              <h3 className="mb-4 text-4xl" style={{ fontFamily: "var(--font-serif), serif" }}>
                The Sourcing.
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500">
                Each item is tagged by where to buy it — bring from India or purchase locally. Know exactly what to pack before you board, and what to buy when you arrive.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="flex w-full flex-col items-center justify-between border-t border-black/10 bg-[#F3F3F3] px-8 py-10 md:flex-row">
        <div className="mb-6 md:mb-0">
          <div className="mb-1.5 text-sm font-bold tracking-tighter" style={{ fontFamily: "var(--font-serif), serif" }}>
            STUDENTKIT
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            © 2026 STUDENTKIT. THE ACADEMIC MONOGRAPH.
          </div>
        </div>
        <div className="flex gap-10">
          {["Terms", "Privacy", "Archive"].map((link) => (
            <a key={link} href="#" className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black">
              {link}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
