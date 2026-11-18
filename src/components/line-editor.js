"use client";
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
/** Converts UI drafts to server payload lines. "total": first line carries the total, the rest are descriptive roll-ups. */
export function toPayloadLines(mode, total, lines) {
    const clean = lines.filter((l) => l.description.trim());
    if (mode === "total") {
        return clean.map((l, i) => ({ description: l.description.trim(), sacCode: l.sacCode, amountUsd: i === 0 ? Number(total) || 0 : null }));
    }
    return clean.map((l) => ({ description: l.description.trim(), sacCode: l.sacCode, amountUsd: Number(l.amount) || 0 }));
}
export const draftTotal = (mode, total, lines) => mode === "total" ? Number(total) || 0 : lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
export function LineEditor({ mode, lines, onChange, services, defaultSac }) {
    const update = (i, patch) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    return (<div className="space-y-2">
      {lines.map((l, i) => (<div key={i} className="grid grid-cols-12 items-start gap-2">
          <Textarea className="col-span-7 min-h-[38px]" rows={1} placeholder="Work description" value={l.description} onChange={(e) => update(i, { description: e.target.value })}/>
          <Input className="col-span-2" placeholder="SAC" value={l.sacCode} onChange={(e) => update(i, { sacCode: e.target.value })}/>
          {mode === "itemized" ? <Input className="col-span-2" type="number" step="0.01" min="0" placeholder="USD" value={l.amount} onChange={(e) => update(i, { amount: e.target.value })}/> : <div className="col-span-2"/>}
          <Button variant="ghost" size="icon" aria-label="Remove line" onClick={() => onChange(lines.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4"/></Button>
        </div>))}
      <div className="flex flex-wrap items-center gap-2">
        <Select className="w-64" value="" onChange={(e) => {
            const s = services.find((x) => x.id === Number(e.target.value));
            if (s)
                onChange([...lines, { description: s.descriptionLine, sacCode: s.defaultSacCode, amount: "" }]);
        }}>
          <option value="">+ Add from Service Master…</option>
          {services.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.id}>[{s.category}] {s.title}</option>)}
        </Select>
        <Button variant="outline" size="sm" onClick={() => onChange([...lines, { description: "", sacCode: defaultSac, amount: "" }])}><Plus className="h-3 w-3"/> Custom line</Button>
      </div>
    </div>);
}
