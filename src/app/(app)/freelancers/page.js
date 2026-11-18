import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listFreelancers } from "@/lib/queries";
import { Card, StatusBadge, linkButton } from "@/components/ui";
export default async function FreelancersPage() {
    const u = await requireUser();
    const rows = await listFreelancers(u);
    return (<div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Freelancers</h1>
        {u.role === "ADMIN" ? <Link className={linkButton("default")} href="/freelancers/new">Add freelancer</Link> : null}</div>
      <Card className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs text-muted-foreground"><tr>{["Name", "GSTIN", "Invoice prefix", "Next seq", "LUT", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((f) => (<tr key={f.id} className="border-t"><td className="px-3 py-2 font-medium">{f.fullName}</td><td className="px-3 py-2">{f.gstin}</td><td className="px-3 py-2">{f.invoicePrefix}</td>
            <td className="px-3 py-2">{f.nextSequenceNumber}</td><td className="px-3 py-2">{f.lutNumber} ({f.lutFinancialYear})</td>
            <td className="px-3 py-2"><StatusBadge status={f.isActive ? "ACTIVE" : "INACTIVE"}/></td>
            <td className="px-3 py-2"><Link className={linkButton("outline", "sm")} href={`/freelancers/${f.id}`}>Open</Link></td></tr>))}
        </tbody></table></Card>
    </div>);
}
