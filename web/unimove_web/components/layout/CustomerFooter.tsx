import Link from "next/link";

const LINKS = [
  { href: "/#tinh-nang", label: "Tính năng" },
  { href: "/#dich-vu", label: "Dịch vụ" },
  { href: "/#lien-he", label: "Liên hệ" },
] as const;

export function CustomerFooter() {
  return (
    <footer className="hidden border-t border-gray-200 bg-white lg:block">
      <div className="mx-auto flex max-w-[var(--width-container)] flex-col gap-6 px-8 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-extrabold tracking-tight">
            <span className="text-[#FFC107]">Uni</span>
            <span className="text-[#0047FF]">Move</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">Logistics đáng tin cho chuyến chuyển trọ của bạn.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm text-gray-600 no-underline transition-colors hover:text-[#0047FF]">
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-gray-400 md:text-right">© {new Date().getFullYear()} UniMove Logistics. All rights reserved.</p>
      </div>
    </footer>
  );
}
