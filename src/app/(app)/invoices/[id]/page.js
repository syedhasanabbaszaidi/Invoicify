import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getInvoiceDetail } from "@/lib/queries";
import { Card, CardBody, CardHeader, CardTitle, StatusBadge, linkButton } from "@/components/ui";
import { MONTHS, fmtDate, fmtInr, fmtUsd, num, round2 } from "@/lib/utils";
import { InvoiceActions, RemittanceRow } from "./client";
export default async function InvoiceDetailPage({ params, searchParams }) {
    const u = await requireUser();
    const { id } = await params;
    const { pay } = await searchParams;
    const d = await getInvoiceDetail(u, Number(id));
    if (!d)
        notFound();
    const { inv, freelancer, customer, lines, recons } = d;
    const settled = round2(recons.reduce((a, r) => a + num(r.invoicedUsd), 0));
    const outstanding = round2(num(inv.totalUsd) - settled);
    const isAdmin = u.role === "ADMIN";
    return (<div className="space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3"/> Invoices</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">{inv.invoiceNumber} <StatusBadge status={inv.status}/></h1>
          <p className="text-sm text-muted-foreground">{freelancer.fullName} → {customer.companyName} · {MONTHS[inv.billingMonth - 1]} {inv.billingYear} · dated {fmtDate(inv.invoiceDate)}</p>
        </div>
        <div className="flex gap-2">
          <a className={linkButton("outline")} href={`/api/invoices/${inv.id}/pdf?download=1`}><Download className="h-4 w-4"/> Download 2-page PDF</a>
          {isAdmin ? <InvoiceActions invoice={{ id: inv.id, status: inv.status, invoiceDate: inv.invoiceDate, hasRecons: recons.length > 0, outstanding, totalUsd: num(inv.totalUsd) }} lines={lines.map((l) => ({ description: l.description, sacCode: l.sacCode, amount: l.amountUsd ?? "" }))} openPay={pay === "1"}/> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>PDF preview (Page 1: Tax Invoice, Page 2: Wire instructions)</CardTitle></CardHeader>
          <iframe title="Invoice PDF" src={`/api/invoices/${inv.id}/pdf#toolbar=0`} className="h-[820px] w-full rounded-b-lg"/>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardBody className="space-y-1 text-sm">
            <Row k="Total invoiced" v={fmtUsd(inv.totalUsd)}/><Row k="Settled so far" v={fmtUsd(settled)}/><Row k="Outstanding" v={fmtUsd(outstanding)}/>
            <Row k="Place of supply" v={inv.placeOfSupply}/><Row k="Country of supply" v={inv.countryOfSupply}/>
            <div className="pt-2 text-xs text-muted-foreground">{lines.map((l) => <div key={l.id}>• {l.description}{l.amountUsd ? ` — ${fmtUsd(l.amountUsd)}` : ""}</div>)}</div>
          </CardBody></Card>
          <Card><CardHeader><CardTitle>Inward remittances (USD → INR)</CardTitle></CardHeader><CardBody className="space-y-3">
            {recons.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : recons.map((r) => (<RemittanceRow key={r.id} id={r.id} canDelete={isAdmin}>
                <div className="font-medium">{fmtDate(r.receivedDate)} · Ref {r.bankReferenceNumber}{r.fircNumber ? ` · FIRC ${r.fircNumber}` : ""}</div>
                <div className="text-xs text-muted-foreground">
                  Invoiced {fmtUsd(r.invoicedUsd)} → received {fmtUsd(r.receivedUsd)} (wire fee {fmtUsd(r.bankChargesUsd)}) @ {num(r.exchangeRateInr).toFixed(4)}<br />
                  Gross {fmtInr(r.grossInrAmount)} − bank {fmtInr(r.bankInrDeductions)} = <b>{fmtInr(r.netInrCredited)}</b>
                </div>
              </RemittanceRow>))}
          </CardBody></Card>
        </div>
      </div>
    </div>);
}
const Row = ({ k, v }) => <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
