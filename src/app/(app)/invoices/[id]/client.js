"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Wallet, Ban, Undo2 } from "lucide-react";
import { Button, Dialog, ErrorText, Field, Input, Textarea } from "@/components/ui";
import { LineEditor, toPayloadLines, draftTotal } from "@/components/line-editor";
import { deleteRemittance, recordRemittance, setInvoiceCancelled, updateInvoice } from "@/actions/invoices";
import { fmtInr, fmtUsd, round2 } from "@/lib/utils";
export function InvoiceActions({ invoice, lines, openPay }) {
    const router = useRouter();
    const [pay, setPay] = React.useState(openPay && invoice.outstanding > 0);
    const [edit, setEdit] = React.useState(false);
    const [error, setError] = React.useState();
    const cancelled = invoice.status === "CANCELLED";
    async function toggleCancel() {
        if (!confirm(cancelled ? "Reinstate this invoice?" : "Cancel this invoice? It will be excluded from totals."))
            return;
        const r = await setInvoiceCancelled(invoice.id, !cancelled);
        if (!r.ok)
            setError(r.error);
        else
            router.refresh();
    }
    return (<>
      {!cancelled && invoice.outstanding > 0 ? <Button onClick={() => setPay(true)}><Wallet className="h-4 w-4"/> Record Inward Remittance</Button> : null}
      {!cancelled && !invoice.hasRecons ? <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4"/> Edit</Button> : null}
      {!invoice.hasRecons ? <Button variant="ghost" onClick={toggleCancel}>{cancelled ? <><Undo2 className="h-4 w-4"/> Reinstate</> : <><Ban className="h-4 w-4"/> Cancel</>}</Button> : null}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
      <RemittanceDialog open={pay} onClose={() => setPay(false)} invoice={invoice}/>
      <EditDialog open={edit} onClose={() => setEdit(false)} invoice={invoice} initialLines={lines}/>
    </>);
}
function RemittanceDialog({ open, onClose, invoice }) {
    const router = useRouter();
    const today = new Date().toISOString().slice(0, 10);
    const [f, setF] = React.useState({ receivedDate: today, invoicedUsd: String(invoice.outstanding), receivedUsd: String(invoice.outstanding), rate: "", inrDed: "0", firc: "", ref: "", notes: "" });
    const [error, setError] = React.useState();
    const [busy, setBusy] = React.useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const inv = Number(f.invoicedUsd) || 0, rec = Number(f.receivedUsd) || 0, rate = Number(f.rate) || 0, ded = Number(f.inrDed) || 0;
    const fee = round2(inv - rec), gross = round2(rec * rate), net = round2(gross - ded);
    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(undefined);
        const r = await recordRemittance({
            invoiceId: invoice.id, receivedDate: f.receivedDate, invoicedUsd: inv, receivedUsd: rec, exchangeRateInr: rate,
            bankInrDeductions: ded, fircNumber: f.firc, bankReferenceNumber: f.ref, notes: f.notes,
        });
        setBusy(false);
        if (r.ok) {
            onClose();
            router.replace(`/invoices/${invoice.id}`);
            router.refresh();
        }
        else
            setError(r.error);
    }
    return (<Dialog open={open} onOpenChange={(o) => !o && onClose()} title="Record Inward Remittance (USD → INR)">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Settlement date"><Input type="date" required value={f.receivedDate} onChange={set("receivedDate")}/></Field>
          <Field label="Bank reference no."><Input required value={f.ref} onChange={set("ref")}/></Field>
          <Field label={`Invoice USD settled (outstanding ${fmtUsd(invoice.outstanding)})`}><Input type="number" step="0.01" required value={f.invoicedUsd} onChange={set("invoicedUsd")}/></Field>
          <Field label="Actual USD received"><Input type="number" step="0.01" required value={f.receivedUsd} onChange={set("receivedUsd")}/></Field>
          <Field label="Bank exchange rate (INR per USD)"><Input type="number" step="0.0001" required placeholder="84.3500" value={f.rate} onChange={set("rate")}/></Field>
          <Field label="Bank INR deductions (charges/GST)"><Input type="number" step="0.01" value={f.inrDed} onChange={set("inrDed")}/></Field>
          <Field label="FIRC number"><Input value={f.firc} onChange={set("firc")}/></Field>
        </div>
        <Field label="Notes"><Textarea value={f.notes} onChange={set("notes")}/></Field>
        <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary p-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Wire fee (USD)</div><b>{fmtUsd(fee)}</b></div>
          <div><div className="text-xs text-muted-foreground">Gross INR</div><b>{fmtInr(gross)}</b></div>
          <div><div className="text-xs text-muted-foreground">Net INR credited</div><b>{fmtInr(net)}</b></div>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save remittance"}</Button></div>
      </form>
    </Dialog>);
}
function EditDialog({ open, onClose, invoice, initialLines }) {
    const router = useRouter();
    const itemizedInit = initialLines.filter((l) => l.amount !== "").length > 1;
    const [mode, setMode] = React.useState(itemizedInit ? "itemized" : "total");
    const [total, setTotal] = React.useState(String(invoice.totalUsd));
    const [date, setDate] = React.useState(invoice.invoiceDate);
    const [lines, setLines] = React.useState(initialLines);
    const [error, setError] = React.useState();
    const [busy, setBusy] = React.useState(false);
    async function save() {
        setBusy(true);
        setError(undefined);
        const r = await updateInvoice({ invoiceId: invoice.id, invoiceDate: date, lines: toPayloadLines(mode, total, lines) });
        setBusy(false);
        if (r.ok) {
            onClose();
            router.refresh();
        }
        else
            setError(r.error);
    }
    return (<Dialog open={open} onOpenChange={(o) => !o && onClose()} title="Edit invoice" wide>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Invoice date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)}/></Field>
          <Field label="Amount mode">
            <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}><option value="total">Single total</option><option value="itemized">Per-line amounts</option></select>
          </Field>
          {mode === "total" ? <Field label="Total USD"><Input type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)}/></Field> : <div className="self-end text-sm">Total: <b>{fmtUsd(draftTotal(mode, total, lines))}</b></div>}
        </div>
        <LineEditor mode={mode} lines={lines} onChange={setLines} services={[]} defaultSac="998313"/>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div>
      </div>
    </Dialog>);
}
export function RemittanceRow({ id, canDelete, children }) {
    const router = useRouter();
    return (<div className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
      <div>{children}</div>
      {canDelete ? <Button variant="ghost" size="icon" aria-label="Delete remittance" onClick={async () => {
                if (!confirm("Delete this remittance record?"))
                    return;
                const r = await deleteRemittance(id);
                if (r.ok)
                    router.refresh();
                else
                    alert(r.error);
            }}><Trash2 className="h-4 w-4"/></Button> : null}
    </div>);
}
