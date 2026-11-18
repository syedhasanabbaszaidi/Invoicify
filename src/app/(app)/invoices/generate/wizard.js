"use client";
import * as React from "react";
import { Check, Download, Eye, FileArchive } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, ErrorText, Field, Input, Select, StatusBadge, linkButton } from "@/components/ui";
import { LineEditor, toPayloadLines, draftTotal } from "@/components/line-editor";
import { generateInvoices } from "@/actions/invoices";
import { MONTHS, fmtUsd, invoiceNumberFor } from "@/lib/utils";
export function Wizard({ customers, freelancers, services, existing }) {
    const now = new Date();
    const [step, setStep] = React.useState(1);
    const [month, setMonth] = React.useState(now.getMonth() + 1);
    const [year, setYear] = React.useState(now.getFullYear());
    const [invoiceDate, setInvoiceDate] = React.useState(now.toISOString().slice(0, 10));
    const [customerId, setCustomerId] = React.useState(customers[0]?.id ?? 0);
    const [selected, setSelected] = React.useState([]);
    const [drafts, setDrafts] = React.useState({});
    const [error, setError] = React.useState();
    const [busy, setBusy] = React.useState(false);
    const [results, setResults] = React.useState(null);
    const taken = React.useMemo(() => new Set(existing.map((e) => `${e.freelancerId}|${e.invoiceNumber}`)), [existing]);
    const billedThisMonth = (fid) => existing.filter((e) => e.freelancerId === fid && e.month === month && e.year === year && e.status !== "CANCELLED");
    const suggest = (f) => {
        const base = invoiceNumberFor(f.invoicePrefix, month, year);
        let n = base, i = 2;
        while (taken.has(`${f.id}|${n}`))
            n = `${base}-${i++}`;
        return n;
    };
    const customer = customers.find((c) => c.id === customerId);
    const fl = (id) => freelancers.find((f) => f.id === id);
    function toggle(f) {
        setSelected((s) => s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]);
        setDrafts((d) => d[f.id] ? d : { ...d, [f.id]: { invoiceNumber: suggest(f), mode: "total", total: "", lines: [{ description: "", sacCode: f.defaultSacCode, amount: "" }] } });
    }
    const patch = (id, p) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...p } }));
    // Re-suggest numbers when period changes (only if the user hasn't customised them)
    React.useEffect(() => {
        setDrafts((d) => Object.fromEntries(Object.entries(d).map(([id, v]) => {
            const f = freelancers.find((x) => x.id === Number(id));
            const wasAuto = /^.+\/\d{2}\/\d{4}(-\d+)?$/.test(v.invoiceNumber);
            return [id, wasAuto ? { ...v, invoiceNumber: suggest(f) } : v];
        })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year]);
    const issues = (id) => {
        const d = drafts[id];
        const out = [];
        if (!d)
            return out;
        if (!d.invoiceNumber.trim())
            out.push("Invoice number required");
        else if (taken.has(`${id}|${d.invoiceNumber.trim()}`))
            out.push("Invoice number already exists");
        if (!toPayloadLines(d.mode, d.total, d.lines).length)
            out.push("Add at least one work line");
        if (draftTotal(d.mode, d.total, d.lines) <= 0)
            out.push("Enter a USD amount");
        if (d.mode === "itemized" && d.lines.some((l) => l.description.trim() && !(Number(l.amount) > 0)))
            out.push("Every line needs an amount");
        return out;
    };
    const allValid = selected.length > 0 && selected.every((id) => issues(id).length === 0);
    async function preview(id) {
        const d = drafts[id];
        patch(id, { previewing: true, previewError: undefined });
        try {
            const res = await fetch("/api/invoices/preview", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ freelancerId: id, customerId, invoiceNumber: d.invoiceNumber, invoiceDate, lines: toPayloadLines(d.mode, d.total, d.lines) }),
            });
            if (!res.ok)
                throw new Error(await res.text());
            const url = URL.createObjectURL(await res.blob());
            patch(id, { preview: url, previewing: false });
        }
        catch (e) {
            patch(id, { previewing: false, previewError: e instanceof Error ? e.message : "Preview failed" });
        }
    }
    async function generate() {
        setBusy(true);
        setError(undefined);
        const r = await generateInvoices({
            month, year, invoiceDate, customerId,
            items: selected.map((id) => ({ freelancerId: id, invoiceNumber: drafts[id].invoiceNumber.trim(), lines: toPayloadLines(drafts[id].mode, drafts[id].total, drafts[id].lines) })),
        });
        setBusy(false);
        if (r.ok) {
            setResults(r.data);
            setStep(5);
        }
        else
            setError(r.error);
    }
    const steps = ["Period & customer", "Freelancers", "Work & amounts", "Review"];
    if (step === 5 && results) {
        return (<Card><CardHeader><CardTitle>{results.length} invoice(s) generated</CardTitle></CardHeader><CardBody className="space-y-3">
        {results.map((r) => (<div key={r.invoiceId} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <div><b>{r.invoiceNumber}</b> · {fl(r.freelancerId).fullName}</div>
            <div className="flex gap-2">
              <a className={linkButton("outline", "sm")} target="_blank" href={`/api/invoices/${r.invoiceId}/pdf`}><Eye className="h-3 w-3"/> View</a>
              <a className={linkButton("default", "sm")} href={`/api/invoices/${r.invoiceId}/pdf?download=1`}><Download className="h-3 w-3"/> PDF</a>
            </div>
          </div>))}
        <div className="flex gap-2">
          <a className={linkButton("default")} href={`/api/invoices/zip?ids=${results.map((r) => r.invoiceId).join(",")}`}><FileArchive className="h-4 w-4"/> Download All as ZIP</a>
          <a className={linkButton("outline")} href="/invoices/generate">Start another batch</a>
        </div>
      </CardBody></Card>);
    }
    return (<div className="space-y-4">
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((s, i) => (<li key={s} className={`flex items-center gap-2 rounded-full px-3 py-1 ${step === i + 1 ? "bg-primary text-primary-foreground" : step > i + 1 ? "bg-emerald-100 text-emerald-800" : "bg-secondary"}`}>
            {step > i + 1 ? <Check className="h-3 w-3"/> : <span>{i + 1}</span>}{s}
          </li>))}
      </ol>

      {step === 1 && (<Card><CardBody className="grid gap-3 md:grid-cols-4">
          <Field label="Billing month"><Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select></Field>
          <Field label="Billing year"><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}/></Field>
          <Field label="Invoice date"><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}/></Field>
          <Field label="Customer (Billed To)">
            <Select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>{customers.map((c) => <option key={c.id} value={c.id}>{c.companyName} ({c.country})</option>)}</Select>
          </Field>
          {customers.length === 0 ? <p className="text-sm text-destructive md:col-span-4">Add a customer first.</p> : null}
        </CardBody></Card>)}

      {step === 2 && (<Card><CardHeader><CardTitle>Select freelancers for {MONTHS[month - 1]} {year}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => freelancers.filter((f) => !selected.includes(f.id) && billedThisMonth(f.id).length === 0).forEach(toggle)}>Select all unbilled</Button></CardHeader>
          <CardBody className="grid gap-2 md:grid-cols-2">
            {freelancers.map((f) => {
                const b = billedThisMonth(f.id);
                return (<label key={f.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm hover:bg-secondary/40">
                  <input type="checkbox" className="h-4 w-4" checked={selected.includes(f.id)} onChange={() => toggle(f)}/>
                  <div className="flex-1"><div className="font-medium">{f.fullName}</div><div className="text-xs text-muted-foreground">{f.invoicePrefix} · {f.gstin}</div></div>
                  {b.length ? <span className="text-xs text-amber-700">Already billed: {b.map((x) => x.invoiceNumber).join(", ")}</span> : <StatusBadge status="NOT_BILLED"/>}
                </label>);
            })}
          </CardBody></Card>)}

      {step === 3 && selected.map((id) => {
            const f = fl(id), d = drafts[id], iss = issues(id);
            return (<Card key={id}>
            <CardHeader><CardTitle>{f.fullName}</CardTitle><span className="text-sm font-semibold">{fmtUsd(draftTotal(d.mode, d.total, d.lines))}</span></CardHeader>
            <CardBody className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Invoice serial number"><Input value={d.invoiceNumber} onChange={(e) => patch(id, { invoiceNumber: e.target.value })}/></Field>
                <Field label="Amount mode"><Select value={d.mode} onChange={(e) => patch(id, { mode: e.target.value })}><option value="total">Single total USD (grouped lines)</option><option value="itemized">Per-line USD amounts</option></Select></Field>
                {d.mode === "total" ? <Field label="Total USD"><Input type="number" step="0.01" min="0" value={d.total} onChange={(e) => patch(id, { total: e.target.value })}/></Field> : null}
              </div>
              <LineEditor mode={d.mode} lines={d.lines} onChange={(lines) => patch(id, { lines })} services={services} defaultSac={f.defaultSacCode}/>
              {iss.length ? <ErrorText>{iss.join(" · ")}</ErrorText> : null}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={iss.length > 0 || d.previewing} onClick={() => preview(id)}><Eye className="h-3 w-3"/> {d.previewing ? "Rendering…" : d.preview ? "Refresh preview" : "Preview Page 1 & 2"}</Button>
                {d.preview ? <Button variant="ghost" size="sm" onClick={() => patch(id, { preview: undefined })}>Hide</Button> : null}
                {d.previewError ? <span className="text-xs text-destructive">{d.previewError}</span> : null}
              </div>
              {d.preview ? <iframe title={`Preview ${f.fullName}`} src={d.preview} className="h-[700px] w-full rounded-md border"/> : null}
            </CardBody>
          </Card>);
        })}

      {step === 4 && (<Card><CardHeader><CardTitle>Review — {MONTHS[month - 1]} {year} · {customer?.companyName}</CardTitle></CardHeader><CardBody className="space-y-2">
          {selected.map((id) => (<div key={id} className="flex justify-between rounded-md border p-3 text-sm"><span>{drafts[id].invoiceNumber} — {fl(id).fullName}</span><b>{fmtUsd(draftTotal(drafts[id].mode, drafts[id].total, drafts[id].lines))}</b></div>))}
          <div className="flex justify-between border-t pt-2 text-sm font-semibold"><span>Batch total</span><span>{fmtUsd(selected.reduce((a, id) => a + draftTotal(drafts[id].mode, drafts[id].total, drafts[id].lines), 0))}</span></div>
          <ErrorText>{error}</ErrorText>
        </CardBody></Card>)}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 4 ? (<Button disabled={(step === 1 && (!customerId || !invoiceDate)) || (step === 2 && selected.length === 0) || (step === 3 && !allValid)} onClick={() => setStep(step + 1)}>Next</Button>) : <Button disabled={busy || !allValid} onClick={generate}>{busy ? "Generating…" : "Generate Invoices"}</Button>}
      </div>
    </div>);
}
