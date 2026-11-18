import Link from "next/link";
import { Download, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getDashboard, getFreelancerLedger, listCustomers, listFreelancers } from "@/lib/queries";
import { Card, CardBody, CardHeader, CardTitle, StatusBadge, linkButton } from "@/components/ui";
import { MONTHS, fmtInr, fmtUsd, fyLabel, num } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
const GST_THRESHOLD_INR = 2_000_000;
function Kpi({ label, value, sub }) {
    return (<Card><CardBody>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </CardBody></Card>);
}
export default async function DashboardPage({ searchParams }) {
    const u = await requireUser();
    const sp = await searchParams;
    const now = new Date();
    const scope = sp.scope ?? "month";
    const month = Number(sp.month ?? now.getMonth() + 1);
    const year = Number(sp.year ?? now.getFullYear());
    const customerId = sp.customer ? Number(sp.customer) : undefined;
    const freelancerId = u.role === "FREELANCER" ? u.freelancerId ?? undefined : sp.freelancer ? Number(sp.freelancer) : undefined;
    const dash = await getDashboard(u, {
        month: scope === "month" ? month : undefined, year: scope === "month" ? year : undefined,
        fyStart: scope === "fy" ? year : undefined, allMonths: scope === "all", customerId, freelancerId,
    });
    const [customers, roster] = await Promise.all([listCustomers(), listFreelancers(u)]);
    const ledger = freelancerId ? await getFreelancerLedger(u, freelancerId) : null;
    const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() + 1 - i);
    const k = dash.kpis;
    const periodLabel = scope === "month" ? `${MONTHS[month - 1]} ${year}` : scope === "fy" ? `FY ${fyLabel(year)}` : "All time";
    const shown = dash.consolidated.filter((c) => !freelancerId || c.freelancer.id === freelancerId);
    return (<div className="space-y-5">
      <div><h1 className="text-xl font-semibold">Dashboard</h1><p className="text-sm text-muted-foreground">{periodLabel}</p></div>
      <FilterBar customers={customers.map((c) => ({ id: c.id, name: c.companyName }))} freelancers={roster.map((f) => ({ id: f.id, name: f.fullName }))} showFreelancer={u.role === "ADMIN"} years={years}/>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total Billed (USD)" value={fmtUsd(k.billed)}/>
        <Kpi label="Total Realized (USD)" value={fmtUsd(k.realized)} sub={`Bank charges ${fmtUsd(k.bankCharges)}`}/>
        <Kpi label="Total INR Credited" value={fmtInr(k.inr)}/>
        <Kpi label="Pending Reconciliation (USD)" value={fmtUsd(k.pending)}/>
        <Kpi label="Avg Realized Rate (INR/USD)" value={k.avgRate ? k.avgRate.toFixed(4) : "—"}/>
      </div>

      <Card>
        <CardHeader><CardTitle>Billing status by freelancer</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs text-muted-foreground"><tr>
              {["Freelancer", "Invoice #", "Period", "Customer", "Billed USD", "Received USD", "Rate", "Net INR", "Status", "Actions"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {shown.flatMap(({ freelancer, invoices }) => invoices.length === 0 ? (scope === "month" ? [(<tr key={`f${freelancer.id}`} className="border-t text-muted-foreground">
                    <td className="px-3 py-2"><Link className="hover:underline" href={`/dashboard?${new URLSearchParams({ ...sp, freelancer: String(freelancer.id) })}`}>{freelancer.fullName}</Link></td>
                    <td className="px-3 py-2" colSpan={7}>Not billed yet</td>
                    <td className="px-3 py-2"><StatusBadge status="NOT_BILLED"/></td>
                    <td className="px-3 py-2">{u.role === "ADMIN" ? <Link className={linkButton("outline", "sm")} href="/invoices/generate">Generate</Link> : null}</td>
                  </tr>)] : []) : invoices.map((r) => (<tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.freelancerName}</td>
                  <td className="px-3 py-2"><Link className="text-primary hover:underline" href={`/invoices/${r.id}`}>{r.invoiceNumber}</Link></td>
                  <td className="px-3 py-2">{MONTHS[r.billingMonth - 1].slice(0, 3)} {r.billingYear}</td>
                  <td className="px-3 py-2">{r.customerName}</td>
                  <td className="px-3 py-2 text-right">{fmtUsd(r.totalUsd)}</td>
                  <td className="px-3 py-2 text-right">{r.receivedUsd ? fmtUsd(r.receivedUsd) : "—"}</td>
                  <td className="px-3 py-2 text-right">{r.avgRate ? r.avgRate.toFixed(4) : "—"}</td>
                  <td className="px-3 py-2 text-right">{r.netInr ? fmtInr(r.netInr) : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status}/></td>
                  <td className="px-3 py-2"><div className="flex gap-1">
                    <a className={linkButton("outline", "sm")} href={`/api/invoices/${r.id}/pdf?download=1`}><Download className="h-3 w-3"/> PDF</a>
                    {u.role === "ADMIN" && r.status !== "PAID" && r.status !== "CANCELLED" ? <Link className={linkButton("default", "sm")} href={`/invoices/${r.id}?pay=1`}><Wallet className="h-3 w-3"/> Record</Link> : null}
                  </div></td>
                </tr>)))}
            </tbody>
          </table>
        </div>
      </Card>

      {ledger ? (<Card>
          <CardHeader><CardTitle>Freelancer ledger — {roster.find((f) => f.id === freelancerId)?.fullName}</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {ledger.fy.map((y) => {
                const pct = Math.min(100, (y.grossInr / GST_THRESHOLD_INR) * 100);
                return (<div key={y.fyStart} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">FY {fyLabel(y.fyStart)} — export turnover</div>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <span>Billed: {fmtUsd(y.billedUsd)}</span><span>Realized: {fmtUsd(y.realizedUsd)}</span>
                      <span>Gross INR realized: {fmtInr(y.grossInr)}</span><span>Pending: {fmtUsd(y.pendingUsd)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded bg-secondary"><div className={`h-2 rounded ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }}/></div>
                    <div className="mt-1 text-xs text-muted-foreground">{pct.toFixed(1)}% of ₹20,00,000 GST registration threshold (realized export turnover)</div>
                  </div>);
            })}
              {ledger.fy.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet.</p> : null}
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr>{["Month", "Invoice #", "Billed", "Received", "Net INR", "Status"].map((h) => <th key={h} className="px-2 py-1 font-medium">{h}</th>)}</tr></thead>
              <tbody>{ledger.invoices.map((r) => (<tr key={r.id} className="border-t">
                  <td className="px-2 py-1">{MONTHS[r.billingMonth - 1]} {r.billingYear}</td>
                  <td className="px-2 py-1"><Link className="text-primary hover:underline" href={`/invoices/${r.id}`}>{r.invoiceNumber}</Link></td>
                  <td className="px-2 py-1">{fmtUsd(r.totalUsd)}</td><td className="px-2 py-1">{fmtUsd(r.receivedUsd)}</td>
                  <td className="px-2 py-1">{fmtInr(num(r.netInr))}</td><td className="px-2 py-1"><StatusBadge status={r.status}/></td>
                </tr>))}</tbody>
            </table>
          </CardBody>
        </Card>) : null}
    </div>);
}
