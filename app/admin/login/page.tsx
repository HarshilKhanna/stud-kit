"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, authReady } = useAdminAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated) router.replace("/admin/dashboard");
  }, [authReady, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) {
      setError("Incorrect username or password.");
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-4">
      {/* Back link */}
      <div className="mb-6 w-full max-w-sm">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to browsing
        </Link>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white px-8 py-9 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold tracking-tight text-neutral-900">StudentKit</p>
          <p className="mt-0.5 text-[11px] font-light text-neutral-400">Admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              autoFocus
              autoComplete="username"
              placeholder="Enter username"
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="current-password"
              placeholder="Enter password"
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
