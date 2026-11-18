"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, CardTitle, ErrorText, Field, Input } from "@/components/ui";
import { removeUpload, saveBankProfile, saveFreelancer, uploadBankDoc, uploadSignature } from "@/actions/masters";
const blankF = { fullName: "", tradeName: "", email: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", gstin: "", pan: "", lutNumber: "", lutFinancialYear: "2026-27", invoicePrefix: "", nextSequenceNumber: "1", defaultSacCode: "998313", jurisdictionCity: "Gautam Buddh Nagar (Noida)" };
const blankB = { intermediaryBankName: "", intermediarySwift: "", chipsUid: "", fedAbaRouting: "", nostroAccountNumber: "", beneficiaryBankName: "", beneficiaryBranchAddress: "", beneficiarySwift: "", beneficiaryIfsc: "", accountHolderName: "", accountNumber: "", accountHolderAddress: "", purposeCode: "P0802", purposeDescription: "Software implementation/consultancy (other than those covered in SOFTEX form)" };
function useForm(init) {
    const [v, setV] = React.useState(init);
    const bind = (k, label, props = {}) => (<Field label={label}><Input value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))} {...props}/></Field>);
    return { v, bind };
}
const s = (x) => x ?? "";
export function FreelancerEditor({ admin, freelancer, bank }) {
    const router = useRouter();
    const f = useForm(freelancer ? {
        fullName: freelancer.fullName, tradeName: s(freelancer.tradeName), email: freelancer.email, phone: s(freelancer.phone), addressLine1: freelancer.addressLine1,
        addressLine2: s(freelancer.addressLine2), city: freelancer.city, state: freelancer.state, pincode: freelancer.pincode, gstin: freelancer.gstin, pan: freelancer.pan,
        lutNumber: freelancer.lutNumber, lutFinancialYear: freelancer.lutFinancialYear, invoicePrefix: freelancer.invoicePrefix, nextSequenceNumber: String(freelancer.nextSequenceNumber),
        defaultSacCode: freelancer.defaultSacCode, jurisdictionCity: freelancer.jurisdictionCity,
    } : blankF);
    const b = useForm(bank ? {
        intermediaryBankName: s(bank.intermediaryBankName), intermediarySwift: s(bank.intermediarySwift), chipsUid: s(bank.chipsUid), fedAbaRouting: s(bank.fedAbaRouting),
        nostroAccountNumber: s(bank.nostroAccountNumber), beneficiaryBankName: bank.beneficiaryBankName, beneficiaryBranchAddress: s(bank.beneficiaryBranchAddress),
        beneficiarySwift: s(bank.beneficiarySwift), beneficiaryIfsc: s(bank.beneficiaryIfsc), accountHolderName: bank.accountHolderName, accountNumber: bank.accountNumber,
        accountHolderAddress: s(bank.accountHolderAddress), purposeCode: bank.purposeCode, purposeDescription: bank.purposeDescription,
    } : blankB);
    const [useUploaded, setUseUploaded] = React.useState(bank?.useUploadedDocForPage2 ?? false);
    const [active, setActive] = React.useState(freelancer?.isActive ?? true);
    const [msg, setMsg] = React.useState();
    const flash = (r, ok) => setMsg(r.ok ? { kind: "ok", text: ok } : { kind: "err", text: r.error ?? "Failed" });
    async function saveF() {
        const r = await saveFreelancer({ ...f.v, id: freelancer?.id, nextSequenceNumber: Number(f.v.nextSequenceNumber), isActive: active });
        if (r.ok && !freelancer) {
            router.replace(`/freelancers/${r.data.id}`);
            return;
        }
        flash(r.ok ? { ok: true } : r, "Freelancer saved");
        if (r.ok)
            router.refresh();
    }
    async function saveB() {
        if (!freelancer)
            return;
        const r = await saveBankProfile({ ...b.v, freelancerId: freelancer.id, useUploadedDocForPage2: useUploaded });
        flash(r.ok ? { ok: true } : r, "Bank profile saved");
        if (r.ok)
            router.refresh();
    }
    async function upload(kind, file) {
        if (!file || !freelancer)
            return;
        const fd = new FormData();
        fd.set("file", file);
        fd.set("freelancerId", String(freelancer.id));
        const r = await (kind === "signature" ? uploadSignature(fd) : uploadBankDoc(fd));
        flash(r.ok ? { ok: true } : r, "Uploaded");
        if (r.ok)
            router.refresh();
    }
    return (<div className="space-y-5">
      <h1 className="text-xl font-semibold">{freelancer ? freelancer.fullName : "New freelancer"}</h1>
      {msg ? <p className={`rounded-md px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p> : null}

      <Card><CardHeader><CardTitle>Profile, GST & LUT</CardTitle></CardHeader><CardBody className="grid gap-3 md:grid-cols-3">
        {f.bind("fullName", "Full name")}{f.bind("tradeName", "Trade name (optional)")}{f.bind("email", "Email", { type: "email" })}
        {f.bind("phone", "Phone")}{f.bind("addressLine1", "Address line 1")}{f.bind("addressLine2", "Address line 2")}
        {f.bind("city", "City")}{f.bind("state", "State")}{f.bind("pincode", "PIN code")}
        {f.bind("gstin", "GSTIN", { disabled: !admin && !!freelancer })}{f.bind("pan", "PAN")}{f.bind("defaultSacCode", "Default SAC code")}
        {f.bind("lutNumber", "LUT number")}{f.bind("lutFinancialYear", "LUT financial year (2026-27)")}{f.bind("jurisdictionCity", "Jurisdiction city")}
        {f.bind("invoicePrefix", "Invoice prefix (e.g. RS/SA)", { disabled: !admin && !!freelancer })}
        {f.bind("nextSequenceNumber", "Next sequence number", { type: "number", disabled: !admin })}
        {admin ? <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}/> Active</label> : null}
        <div className="md:col-span-3"><Button onClick={saveF}>{freelancer ? "Save profile" : "Create freelancer"}</Button></div>
      </CardBody></Card>

      {freelancer ? (<>
          <Card><CardHeader><CardTitle>Signature image</CardTitle></CardHeader><CardBody className="flex items-center gap-4">
            {freelancer.signatureImageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={freelancer.signatureImageUrl} alt="Signature" className="h-16 rounded border bg-white p-1"/> : <span className="text-sm text-muted-foreground">No signature uploaded</span>}
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => upload("signature", e.target.files?.[0])} className="text-sm"/>
            {freelancer.signatureImageUrl ? <Button variant="ghost" size="sm" onClick={async () => { await removeUpload(freelancer.id, "signature"); router.refresh(); }}>Remove</Button> : null}
          </CardBody></Card>

          <Card><CardHeader><CardTitle>Bank information — Page 2 (wire transfer instructions)</CardTitle></CardHeader><CardBody className="space-y-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Intermediary / Correspondent / Nostro bank</h4>
            <div className="grid gap-3 md:grid-cols-3">{b.bind("intermediaryBankName", "Bank name")}{b.bind("intermediarySwift", "SWIFT")}{b.bind("chipsUid", "CHIPS UID")}{b.bind("fedAbaRouting", "FED ABA routing")}{b.bind("nostroAccountNumber", "Nostro account number")}</div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Beneficiary bank (India)</h4>
            <div className="grid gap-3 md:grid-cols-3">{b.bind("beneficiaryBankName", "Bank name")}{b.bind("beneficiaryBranchAddress", "Branch address")}{b.bind("beneficiarySwift", "SWIFT")}{b.bind("beneficiaryIfsc", "IFSC")}</div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Final beneficiary</h4>
            <div className="grid gap-3 md:grid-cols-3">{b.bind("accountHolderName", "Account holder name")}{b.bind("accountNumber", "Account number")}{b.bind("accountHolderAddress", "Account holder address")}{b.bind("purposeCode", "Purpose code")}{b.bind("purposeDescription", "Purpose description")}</div>
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 font-medium">Upload bank-issued instruction document (PDF / PNG / JPEG)</div>
              <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => upload("bank", e.target.files?.[0])}/>
              {bank?.uploadedBankDocUrl ? <div className="mt-2 flex items-center gap-3"><a className="text-primary underline" href={bank.uploadedBankDocUrl} target="_blank" rel="noreferrer">View uploaded file</a>
                <Button variant="ghost" size="sm" onClick={async () => { await removeUpload(freelancer.id, "bank"); setUseUploaded(false); router.refresh(); }}>Remove</Button></div> : null}
              <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={useUploaded} disabled={!bank?.uploadedBankDocUrl} onChange={(e) => setUseUploaded(e.target.checked)}/> Use uploaded document as Page 2 instead of generated template</label>
            </div>
            <Button onClick={saveB}>Save bank profile</Button>
            <p className="text-xs text-muted-foreground">Bank details are snapshotted onto each invoice at generation time; changes here never alter past invoices.</p>
          </CardBody></Card>
        </>) : <ErrorText>Save the profile first to add signature and bank details.</ErrorText>}
    </div>);
}
