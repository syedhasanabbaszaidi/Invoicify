"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dialog, ErrorText, Field, Input, Select, StatusBadge, Textarea } from "@/components/ui";
import { saveService } from "@/actions/masters";
export function ServicesClient({ rows }) {
    const router = useRouter();
    const [editing, setEditing] = React.useState(null);
    const [v, setV] = React.useState({ title: "", descriptionLine: "", defaultSacCode: "998313", category: "QA", isActive: true });
    const [error, setError] = React.useState();
    function open(s) {
        setError(undefined);
        setEditing(s);
        setV(s === "new" ? { title: "", descriptionLine: "", defaultSacCode: "998313", category: "QA", isActive: true } : { title: s.title, descriptionLine: s.descriptionLine, defaultSacCode: s.defaultSacCode, category: s.category, isActive: s.isActive });
    }
    async function save() {
        const r = await saveService({ ...v, category: v.category, id: editing && editing !== "new" ? editing.id : undefined });
        if (r.ok) {
            setEditing(null);
            router.refresh();
        }
        else
            setError(r.error);
    }
    return (<div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Service Description Master</h1><Button onClick={() => open("new")}>Add service</Button></div>
      <Card className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs text-muted-foreground"><tr>{["Title", "Description line", "SAC", "Category", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((s) => <tr key={s.id} className="border-t"><td className="px-3 py-2 font-medium">{s.title}</td><td className="px-3 py-2">{s.descriptionLine}</td><td className="px-3 py-2">{s.defaultSacCode}</td><td className="px-3 py-2">{s.category}</td>
          <td className="px-3 py-2"><StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"}/></td><td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => open(s)}>Edit</Button></td></tr>)}</tbody></table></Card>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "Add service" : "Edit service"}>
        <div className="space-y-3">
          <Field label="Title"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })}/></Field>
          <Field label="Description line (printed on invoice)"><Textarea value={v.descriptionLine} onChange={(e) => setV({ ...v, descriptionLine: e.target.value })}/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default SAC"><Input value={v.defaultSacCode} onChange={(e) => setV({ ...v, defaultSacCode: e.target.value })}/></Field>
            <Field label="Category"><Select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{["QA", "DEV", "DEVOPS", "CONSULTING"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })}/> Active</label>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></div>
        </div>
      </Dialog>
    </div>);
}
