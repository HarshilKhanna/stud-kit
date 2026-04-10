export function Footer() {
  return (
    <footer
      className="flex w-full flex-col items-center justify-between border-t border-black/10 bg-[#F3F3F3] px-8 py-10 md:flex-row"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      <div className="mb-6 md:mb-0">
        <div
          className="mb-1.5 text-sm font-bold tracking-tighter"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          STUDENTKIT
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
          © 2026 STUDENTKIT. THE ACADEMIC MONOGRAPH.
        </div>
      </div>
      <div className="flex gap-10">
        {["Terms", "Privacy", "Archive"].map((link) => (
          <a
            key={link}
            href="#"
            className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-black"
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
