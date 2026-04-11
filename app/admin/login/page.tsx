"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, authReady } = useAdminAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated) router.replace("/admin/dashboard");
  }, [authReady, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(username, password);
    setLoading(false);
    if (!ok) {
      setError("Incorrect username or password.");
      setPassword("");
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#F9F9F9]"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      {/* ── Decorative watermark ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold leading-none tracking-tighter text-neutral-100"
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: "clamp(6rem, 20vw, 22rem)",
          }}
        >
          SK
        </span>
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 px-5 py-6 md:px-10 md:py-8">
        <Link
          href="/browse"
          className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to browsing
        </Link>
      </div>

      {/* ── Main content — centered ── */}
      <main className="relative z-10 flex flex-1 items-center justify-start px-5 pb-16 md:px-10 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Brand */}
          <div className="mb-10 md:mb-14">
            <h1
              className="text-3xl font-bold tracking-tight text-black"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              StudentKit
            </h1>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              The Academic Monograph
            </p>
          </div>

          {/* Heading */}
          <h2
            className="mb-8 font-semibold tracking-tight text-black"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            }}
          >
            Sign in
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Username */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Username
              </label>
              {/* font-size must be ≥16px to prevent iOS zoom */}
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
                placeholder="your.name@academic.edu"
                className="w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-base text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password"
                placeholder="••••••••••"
                className="w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-base text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-semibold uppercase tracking-widest text-red-500"
              >
                {error}
              </motion.p>
            )}

            {/* Submit — full width, min 44px tap target */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mt-4 w-full bg-black py-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: "var(--font-serif), serif", minHeight: "52px" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* ── Bottom footer ── */}
      <footer className="relative z-10 border-t border-neutral-200/60 px-5 py-5 md:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            © 2026 The Academic Monograph
          </span>
          <div className="flex flex-wrap gap-6">
            {["Privacy", "Terms", "Archive", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
