"use client";

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl animate-mesh-1"
        style={{ background: "radial-gradient(circle, var(--glow-primary) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -left-20 w-[360px] h-[360px] rounded-full opacity-30 blur-3xl animate-mesh-2"
        style={{ background: "radial-gradient(circle, var(--glow-secondary) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full opacity-25 blur-3xl animate-mesh-3"
        style={{ background: "radial-gradient(circle, var(--glow-accent) 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, var(--bg) 85%)",
        }}
      />
    </div>
  );
}
