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
      {/* ── Decorative watermark (right side) ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 flex h-full w-1/2 select-none items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span
          className="text-[22rem] font-bold leading-none tracking-tighter text-neutral-100"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          SK
        </span>
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 px-10 py-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to browsing
        </Link>
      </div>

      {/* ── Main content ── */}
      <main className="relative z-10 flex flex-1 items-center px-10 pb-24 md:px-20 lg:px-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Brand */}
          <div className="mb-14">
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
            className="mb-10 text-4xl font-semibold tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            Sign in
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
                placeholder="your.name@academic.edu"
                className="w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-sm text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password"
                placeholder="••••••••••"
                className="w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-sm text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
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

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mt-4 w-full bg-black py-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>

          {/* Footer text */}
          <p className="mt-8 text-center text-sm text-neutral-400">
            New to the curriculum?{" "}
            <a
              href="#"
              className="font-semibold text-black underline-offset-2 hover:underline"
            >
              Create an account
            </a>
          </p>
        </motion.div>
      </main>

      {/* ── Bottom footer ── */}
      <footer className="relative z-10 flex w-full flex-col items-start justify-between gap-4 border-t border-neutral-200/60 px-10 py-6 md:flex-row md:items-center md:px-20 lg:px-32">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          © 2024 The Academic Monograph
        </span>
        <div className="flex gap-8">
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
      </footer>
    </div>
  );
}
