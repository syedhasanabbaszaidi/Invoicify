"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dialog, ErrorText, Field, Input, StatusBadge, Textarea } from "@/components/ui";
import { saveCustomer } from "@/actions/masters";
const blank = { companyName: "", addressLine1: "", addressLine2: "", city: "", stateProvince: "", postalCode: "", country: "", stateCode: "", taxIdOrGstin: "", billingEmail: "", defaultCurrency: "USD", paymentTermsNotes: "" };
export function CustomersClient({ rows }) {
    const router = useRouter();
    const [editing, setEditing] = React.useState(null);
    const [v, setV] = React.useState(blank);
    const [active, setActive] = React.useState(true);
    const [error, setError] = React.useState();
    function open(c) {
        setError(undefined);
        setEditing(c);
        if (c === "new") {
            setV(blank);
            setActive(true);
        }
        else {
            setV(Object.fromEntries(Object.keys(blank).map((k) => [k, String(c[k] ?? "")])));
            setActive(c.isActive);
        }
    }
    async function save() {
        const r = await saveCustomer({ ...v, id: editing && editing !== "new" ? editing.id : undefined, isActive: active });
        if (r.ok) {
            setEditing(null);
            router.refresh();
        }
        else
            setError(r.error);
    }
    const f = (k, label) => <Field label={label}><Input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })}/></Field>;
    return (<div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Customers</h1><Button onClick={() => open("new")}>Add customer</Button></div>
      <Card className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs text-muted-foreground"><tr>{["Company", "City", "Country", "Tax ID", "Currency", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((c) => <tr key={c.id} className="border-t"><td className="px-3 py-2 font-medium">{c.companyName}</td><td className="px-3 py-2">{c.city}</td><td className="px-3 py-2">{c.country}</td>
          <td className="px-3 py-2">{c.taxIdOrGstin ?? "—"}</td><td className="px-3 py-2">{c.defaultCurrency}</td><td className="px-3 py-2"><StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"}/></td>
          <td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => open(c)}>Edit</Button></td></tr>)}</tbody></table></Card>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "Add customer" : "Edit customer"} wide>
        <div className="grid grid-cols-2 gap-3">
          {f("companyName", "Company name")}{f("billingEmail", "Billing email")}{f("addressLine1", "Address line 1")}{f("addressLine2", "Address line 2")}
          {f("city", "City")}{f("stateProvince", "State / Province")}{f("postalCode", "Postal code")}{f("country", "Country (country of supply)")}
          {f("stateCode", "State code")}{f("taxIdOrGstin", "Tax ID / GSTIN")}{f("defaultCurrency", "Currency")}
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}/> Active</label>
          <Field label="Payment terms / notes" className="col-span-2"><Textarea value={v.paymentTermsNotes} onChange={(e) => setV({ ...v, paymentTermsNotes: e.target.value })}/></Field>
        </div>
        <div className="mt-3 space-y-2"><ErrorText>{error}</ErrorText><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></div></div>
      </Dialog>
    </div>);
}
