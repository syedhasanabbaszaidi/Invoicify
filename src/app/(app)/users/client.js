"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dialog, ErrorText, Field, Input, Select, StatusBadge } from "@/components/ui";
import { createUser, resetUserPassword, setUserActive } from "@/actions/masters";
export function UsersClient({ users, freelancers, meId }) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [v, setV] = React.useState({ name: "", email: "", password: "", role: "FREELANCER", freelancerId: "" });
    const [error, setError] = React.useState();
    async function create() {
        const r = await createUser({ ...v, role: v.role, freelancerId: v.freelancerId ? Number(v.freelancerId) : null });
        if (r.ok) {
            setOpen(false);
            setV({ name: "", email: "", password: "", role: "FREELANCER", freelancerId: "" });
            router.refresh();
        }
        else
            setError(r.error);
    }
    return (<div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Users</h1><Button onClick={() => { setError(undefined); setOpen(true); }}>Add user</Button></div>
      <Card className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs text-muted-foreground"><tr>{["Name", "Email", "Role", "Linked freelancer", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{users.map((u) => (<tr key={u.id} className="border-t"><td className="px-3 py-2 font-medium">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.role}</td>
            <td className="px-3 py-2">{freelancers.find((f) => f.id === u.freelancerId)?.name ?? "—"}</td><td className="px-3 py-2"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"}/></td>
            <td className="flex gap-1 px-3 py-2">
              <Button size="sm" variant="outline" disabled={u.id === meId && u.isActive} onClick={async () => { const r = await setUserActive(u.id, !u.isActive); if (r.ok)
            router.refresh();
        else
            alert(r.error); }}>{u.isActive ? "Deactivate" : "Activate"}</Button>
              <Button size="sm" variant="ghost" onClick={async () => { const p = prompt("New password (min 8 chars)"); if (!p)
            return; const r = await resetUserPassword(u.id, p); alert(r.ok ? "Password updated" : r.error); }}>Reset password</Button>
            </td></tr>))}</tbody></table></Card>
      <Dialog open={open} onOpenChange={setOpen} title="Add user">
        <div className="space-y-3">
          <Field label="Name"><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })}/></Field>
          <Field label="Email"><Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })}/></Field>
          <Field label="Temporary password"><Input type="password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })}/></Field>
          <Field label="Role"><Select value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}><option value="FREELANCER">FREELANCER</option><option value="ADMIN">ADMIN</option></Select></Field>
          {v.role === "FREELANCER" ? <Field label="Linked freelancer"><Select value={v.freelancerId} onChange={(e) => setV({ ...v, freelancerId: e.target.value })}><option value="">Select…</option>{freelancers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></Field> : null}
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></div>
        </div>
      </Dialog>
    </div>);
}
