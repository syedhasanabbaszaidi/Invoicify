"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePlus2, FileText, Users, Building2, ListChecks, ShieldCheck, LogOut, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, admin: false },
    { href: "/invoices/generate", label: "Generate Invoices", icon: FilePlus2, admin: true },
    { href: "/invoices", label: "Invoices", icon: FileText, admin: false },
    { href: "/freelancers", label: "Freelancers", icon: Users, admin: false },
    { href: "/customers", label: "Customers", icon: Building2, admin: true },
    { href: "/services", label: "Services", icon: ListChecks, admin: true },
    { href: "/users", label: "Users", icon: ShieldCheck, admin: true },
];
export function Sidebar({ role, name }) {
    const path = usePathname();
    const items = nav.filter((n) => role === "ADMIN" || !n.admin);
    const active = (href) => (href === "/invoices" ? path === "/invoices" || (/^\/invoices\/\d+/.test(path)) : path.startsWith(href));
    return (<aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-4 py-4 text-lg font-bold text-primary"><Receipt className="h-5 w-5"/> Invoicify</div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map(({ href, label, icon: Icon }) => (<Link key={href} href={href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm", active(href) ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
            <Icon className="h-4 w-4"/>{label}
          </Link>))}
      </nav>
      <div className="border-t p-3 text-xs">
        <div className="truncate font-medium">{name}</div>
        <div className="mb-2 text-muted-foreground">{role}</div>
        <form action={logoutAction}><button className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><LogOut className="h-3 w-3"/> Sign out</button></form>
      </div>
    </aside>);
}
