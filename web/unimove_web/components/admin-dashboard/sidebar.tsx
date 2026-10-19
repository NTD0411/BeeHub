"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  AlertTriangle,
  Star,
  ShoppingBag,
  BarChart3,
  Bell,
  History,
  Activity,
  RotateCcw,
  Wallet,
  Settings,
  Truck,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/admin/utils";
import { useSidebarStore } from "@/lib/admin/stores/sidebar-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  subItems?: SubItem[];
}

interface SidebarProps {
  pendingVerifications?: number;
}

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

function buildNavItems(pendingVerifications?: number): NavItem[] {
  return [
    {
      label: "Tổng quan",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Người dùng",
      href: "/admin/users",
      icon: Users,
      subItems: [
        { label: "Khách hàng", href: "/admin/users?tab=customers" },
        { label: "Nhà vận chuyển", href: "/admin/users?tab=providers" },
      ],
    },
    {
      label: "Xác minh",
      href: "/admin/verifications",
      icon: ShieldCheck,
      badge: pendingVerifications,
    },
    {
      label: "Đơn hàng",
      href: "/admin/orders",
      icon: Package,
    },
    {
      label: "Khiếu nại",
      href: "/admin/disputes",
      icon: AlertTriangle,
    },
    {
      label: "Yêu cầu hoàn tiền",
      href: "/admin/refunds",
      icon: RotateCcw,
    },
    {
      label: "Đánh giá",
      href: "/admin/reviews",
      icon: Star,
    },
    {
      label: "Pass đồ",
      href: "/admin/pass-do",
      icon: ShoppingBag,
    },
    {
      label: "Thống kê",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      label: "Hành vi GA4",
      href: "/admin/user-behavior",
      icon: Activity,
    },
    {
      label: "Tài chính",
      href: "/admin/finance",
      icon: Wallet,
    },
    {
      label: "Thông báo",
      href: "/admin/notifications",
      icon: Bell,
    },
    {
      label: "Nhật ký hoạt động",
      href: "/admin/activity-logs",
      icon: History,
    },
    {
      label: "Cài đặt",
      href: "/admin/settings",
      icon: Settings,
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isItemActive(
  href: string,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): boolean {
  if (href.includes("?")) {
    const [path, query] = href.split("?");
    const [key, value] = query.split("=");
    return pathname === path && searchParams.get(key) === value;
  }
  return pathname === href || pathname.startsWith(href + "/");
}

// ---------------------------------------------------------------------------
// NavLink component
// ---------------------------------------------------------------------------

interface NavLinkProps {
  item: NavItem;
  isCollapsed: boolean;
  expandedItems: Set<string>;
  toggleExpand: (href: string) => void;
}

function NavLink({
  item,
  isCollapsed,
  expandedItems,
  toggleExpand,
}: NavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = isItemActive(item.href, pathname, searchParams);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isExpanded = expandedItems.has(item.href);

  const Icon = item.icon;

  const linkContent = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none",
        "text-sm font-medium",
        active
          ? "text-white"
          : "hover:text-[var(--text)]"
      )}
      style={
        active
          ? { backgroundColor: "var(--primary)", color: "#fff" }
          : undefined
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor =
            "var(--primary-tint)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "";
        }
      }}
      onClick={() => {
        if (hasSubItems && !isCollapsed) {
          toggleExpand(item.href);
        }
      }}
    >
      <Icon
        size={18}
        className="shrink-0"
        style={{ color: active ? "#fff" : "var(--muted)" }}
      />

      {!isCollapsed && (
        <>
          <span
            className="flex-1 truncate"
            style={{ color: active ? "#fff" : "var(--text)" }}
          >
            {item.label}
          </span>

          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full text-white bg-red-500">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}

          {hasSubItems && (
            <span
              className="ml-auto transition-transform duration-200"
              style={{
                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            >
              <ChevronDown
                size={14}
                style={{ color: active ? "#fff" : "var(--muted)" }}
              />
            </span>
          )}
        </>
      )}

      {isCollapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip.Root delayDuration={100}>
        <Tooltip.Trigger asChild>
          <Link href={hasSubItems ? item.subItems![0].href : item.href} className="relative block">
            {linkContent}
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 px-3 py-1.5 text-xs font-medium text-white rounded-lg shadow-lg"
            style={{ backgroundColor: "var(--text)" }}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-1.5 text-red-400">({item.badge})</span>
            )}
            <Tooltip.Arrow style={{ fill: "var(--text)" }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  if (hasSubItems) {
    return (
      <div>
        {linkContent}
        {isExpanded && (
          <div className="mt-0.5 ml-7 pl-3 border-l" style={{ borderColor: "var(--border)" }}>
            {item.subItems!.map((sub) => {
              const subActive = isItemActive(sub.href, pathname, searchParams);
              return (
                <Link key={sub.href} href={sub.href}>
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer",
                      subActive ? "font-semibold" : "font-normal"
                    )}
                    style={
                      subActive
                        ? { color: "var(--primary)" }
                        : { color: "var(--muted)" }
                    }
                    onMouseEnter={(e) => {
                      if (!subActive) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          "var(--primary-tint)";
                        (e.currentTarget as HTMLDivElement).style.color =
                          "var(--text)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!subActive) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          "";
                        (e.currentTarget as HTMLDivElement).style.color =
                          "var(--muted)";
                      }
                    }}
                  >
                    {sub.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href} className="block">
      {linkContent}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content (inner, shared between desktop + mobile)
// ---------------------------------------------------------------------------

interface SidebarContentProps {
  isCollapsed: boolean;
  pendingVerifications?: number;
}

function SidebarContent({ isCollapsed, pendingVerifications }: SidebarContentProps) {
  const navItems = buildNavItems(pendingVerifications);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(["/admin/users"])
  );

  function toggleExpand(href: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }

  return (
    <Tooltip.Provider>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-5 shrink-0",
            isCollapsed ? "justify-center px-2" : ""
          )}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Truck size={16} className="text-white" />
          </div>
          {!isCollapsed && (
            <span
              className="text-base font-bold tracking-tight truncate"
              style={{ color: "var(--text)" }}
            >
              UniMove Admin
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 mb-3 h-px" style={{ backgroundColor: "var(--border)" }} />

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
            />
          ))}
        </nav>
      </div>
    </Tooltip.Provider>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar component
// ---------------------------------------------------------------------------

export default function Sidebar({ pendingVerifications }: SidebarProps) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();

  // Close mobile drawer on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Desktop sidebar — in document flow (flex sibling), not fixed overlay */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out border-r"
        style={{
          width: isCollapsed ? "64px" : "256px",
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          pendingVerifications={pendingVerifications}
        />
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out border-r",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          width: "256px",
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--primary-tint)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
          }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>

        <SidebarContent
          isCollapsed={false}
          pendingVerifications={pendingVerifications}
        />
      </aside>
    </>
  );
}
