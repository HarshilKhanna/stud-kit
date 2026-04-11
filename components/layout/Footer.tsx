export function Footer() {
  return (
    <footer
      className="border-t border-black/10 bg-[#F3F3F3]"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-5 py-8 md:flex-row md:px-8 md:py-10">
        <div>
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
        <div className="flex gap-8">
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
      </div>
    </footer>
  );
}
