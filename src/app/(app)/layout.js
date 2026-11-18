import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }) {
    const u = await requireUser();
    return (<div className="flex min-h-screen">
      <Sidebar role={u.role} name={u.name}/>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>);
}
