import fs from "fs";
import path from "path";

const root = path.resolve(".");
const dirs = [
  "app/(admin)",
  "components/admin-dashboard",
  "components/admin-ui",
  "components/admin-providers",
  "lib/admin",
];

const replacements = [
  ["@/components/dashboard/", "@/components/admin-dashboard/"],
  ["@/components/ui/", "@/components/admin-ui/"],
  ["@/components/providers/", "@/components/admin-providers/"],
  ["@/lib/queries/", "@/lib/admin/queries/"],
  ["@/lib/stores/", "@/lib/admin/stores/"],
  ["@/lib/supabase/", "@/lib/admin/supabase/"],
  ["@/lib/normalize-meta", "@/lib/admin/normalize-meta"],
  ["@/lib/server-api", "@/lib/admin/server-api"],
  ["@/lib/formatters", "@/lib/admin/formatters"],
  ["@/lib/admin-auth", "@/lib/admin/admin-auth"],
  ["@/lib/types", "@/lib/admin/types"],
  ["@/lib/utils", "@/lib/admin/utils"],
  ["@/lib/api", "@/lib/admin/api"],
  ['href: "/dashboard"', 'href: "/admin/dashboard"'],
  ['href: "/users"', 'href: "/admin/users"'],
  ['href: "/verifications"', 'href: "/admin/verifications"'],
  ['href: "/orders"', 'href: "/admin/orders"'],
  ['href: "/disputes"', 'href: "/admin/disputes"'],
  ['href: "/reviews"', 'href: "/admin/reviews"'],
  ['href: "/analytics"', 'href: "/admin/analytics"'],
  ['href: "/notifications"', 'href: "/admin/notifications"'],
  ['href: "/activity-logs"', 'href: "/admin/activity-logs"'],
  ['href: "/settings"', 'href: "/admin/settings"'],
  ['href: "/profile"', 'href: "/admin/profile"'],
  ['href: "/users?tab=customers"', 'href: "/admin/users?tab=customers"'],
  ['href: "/users?tab=providers"', 'href: "/admin/users?tab=providers"'],
  ['window.location.href = "/dashboard"', 'window.location.href = "/admin/dashboard"'],
  ['router.push("/dashboard")', 'router.push("/admin/dashboard")'],
  ['router.replace("/dashboard")', 'router.replace("/admin/dashboard")'],
  ['redirect("/dashboard")', 'redirect("/admin/dashboard")'],
  ['"/orders/', '"/admin/orders/'],
  ['"/users/', '"/admin/users/'],
  ['"/verifications/', '"/admin/verifications/'],
  ['"/disputes/', '"/admin/disputes/'],
  ['"/reviews/', '"/admin/reviews/'],
  ['"/analytics/', '"/admin/analytics/'],
  ['"/notifications/', '"/admin/notifications/'],
  ['"/activity-logs/', '"/admin/activity-logs/'],
  ['"/settings/', '"/admin/settings/'],
  ['"/profile/', '"/admin/profile/'],
  ['"/dashboard/', '"/admin/dashboard/'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|ts)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

let count = 0;
for (const d of dirs) {
  const full = path.join(root, d);
  if (!fs.existsSync(full)) continue;
  for (const file of walk(full)) {
    let content = fs.readFileSync(file, "utf8");
    const orig = content;
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    if (content !== orig) {
      fs.writeFileSync(file, content);
      count++;
    }
  }
}

console.log(`Updated ${count} files`);
