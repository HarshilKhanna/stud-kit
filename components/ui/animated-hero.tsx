"use client";

import { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";

const WORDS = ["Furniture", "Lighting", "Decor", "Textiles", "Appliances"];
const TYPE_MS = 85;
const HOLD_MS = 1400;
const DELETE_MS = 50;
const TICK_MS = 50;

function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");

  const stateRef = useRef<{ wordIndex: number; displayText: string; phase: "typing" | "holding" | "deleting" }>({
    wordIndex: 0,
    displayText: "",
    phase: "typing",
  });
  const lastTickRef = useRef(0);
  const holdUntilRef = useRef(0);

  stateRef.current = { wordIndex, displayText, phase };

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const { wordIndex: wi, displayText: dt, phase: p } = stateRef.current;
      const word = WORDS[wi];

      if (p === "holding") {
        if (now < holdUntilRef.current) return;
        setPhase("deleting");
        return;
      }

      if (p === "typing") {
        if (dt.length >= word.length) {
          setPhase("holding");
          holdUntilRef.current = now + HOLD_MS;
          return;
        }
        if (now - lastTickRef.current < TYPE_MS) return;
        lastTickRef.current = now;
        setDisplayText(word.slice(0, dt.length + 1));
        return;
      }

      if (p === "deleting") {
        if (dt.length === 0) {
          setWordIndex((i) => (i + 1) % WORDS.length);
          setPhase("typing");
          lastTickRef.current = now;
          return;
        }
        if (now - lastTickRef.current < DELETE_MS) return;
        lastTickRef.current = now;
        setDisplayText((prev) => prev.slice(0, -1));
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#f5f5f3]">
      <div className="relative mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col items-center gap-4 py-8 lg:py-12">
          {/* Hero heading and copy commented out for now.
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="flex max-w-2xl flex-col items-center text-center text-3xl font-normal tracking-tight text-neutral-900 md:text-5xl">
              <span className="block">Explore the sample flat</span>
              <span className="mt-1 block min-h-[1.2em] font-semibold text-neutral-900">
                {displayText}
                <motion.span
                  className="ml-0.5 inline-block h-[0.9em] w-0.5 align-middle bg-neutral-900"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  aria-hidden
                />
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed tracking-tight text-[var(--text-secondary)] md:text-base">
              See every item used to furnish this flat&mdash;room by room, with
              key details visible at a glance.
            </p>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}

export { Hero };
