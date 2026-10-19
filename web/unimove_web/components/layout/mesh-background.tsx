"use client";

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none lg:opacity-40" aria-hidden>
      <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl animate-mesh-1 bg-[#2563EB]/40" />
      <div className="absolute top-1/3 -left-20 w-[360px] h-[360px] rounded-full opacity-25 blur-3xl animate-mesh-2 bg-[#FFCC00]/30" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full opacity-20 blur-3xl animate-mesh-3 bg-violet-400/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F8FAFC] dark:to-[var(--bg)]" />
    </div>
  );
}
