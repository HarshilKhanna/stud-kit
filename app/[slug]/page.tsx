"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy project URLs redirect to the local StudentKit catalogue. */
export default function LegacySlugPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    router.replace("/browse");
  }, [router, params.slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4 text-center">
      <p className="text-sm text-neutral-500">Redirecting…</p>
    </div>
  );
}
