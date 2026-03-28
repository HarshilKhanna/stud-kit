"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyAppSlugPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/browse");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4 text-center">
      <p className="text-sm text-neutral-500">Redirecting…</p>
    </div>
  );
}
