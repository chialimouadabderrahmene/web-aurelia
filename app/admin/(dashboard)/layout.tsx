import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export const metadata = {
  title: "AURELIA — Admin Panel",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  const nav = [
    { href: "/admin", label: "Dashboard", area: null },
    { href: "/admin/live-view", label: "Live View", area: "live" },
    { href: "/admin/orders", label: "Orders", area: "orders" },
    { href: "/admin/customers", label: "Customers", area: "customers" },
    { href: "/admin/products", label: "Products", area: "products" },
    { href: "/admin/stock", label: "Stock", area: "stock" },
    { href: "/admin/purchasing", label: "Purchasing", area: "purchasing" },
    { href: "/admin/marketing", label: "Marketing", area: "marketing" },
    { href: "/admin/content", label: "Content", area: "content" },
    { href: "/admin/finance", label: "Finance", area: "finance" },
    { href: "/admin/reports", label: "Reports", area: "reports" },
    { href: "/admin/earnings", label: "My Earnings", area: "earnings" },
    { href: "/admin/integrations", label: "Integrations", area: "integrations" },
    { href: "/admin/users", label: "Team & Roles", area: "users" },
    { href: "/admin/audit-log", label: "Audit Log", area: "audit" },
  ].filter((item) => !item.area || canAccess(session.role, item.area));

  return (
    <div className="admin-scope flex min-h-screen overflow-x-hidden bg-cream text-ink">
      <AdminSidebar nav={nav} session={session} />
      <div className="min-w-0 flex flex-1 flex-col">
        <AdminTopbar session={session} nav={nav} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
