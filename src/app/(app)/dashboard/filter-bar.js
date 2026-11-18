"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, Field, Select } from "@/components/ui";
import { MONTHS } from "@/lib/utils";
export function FilterBar({ customers, freelancers, showFreelancer, years }) {
    const router = useRouter();
    const sp = useSearchParams();
    const set = (k, v) => {
        const p = new URLSearchParams(sp.toString());
        if (v)
            p.set(k, v);
        else
            p.delete(k);
        router.push(`/dashboard?${p.toString()}`);
    };
    const scope = sp.get("scope") ?? "month";
    const now = new Date();
    const month = sp.get("month") ?? String(now.getMonth() + 1);
    const year = sp.get("year") ?? String(now.getFullYear());
    return (<Card><CardBody className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Field label="Period">
        <Select value={scope} onChange={(e) => set("scope", e.target.value)}>
          <option value="month">Single month</option><option value="fy">Financial year (Apr–Mar)</option><option value="all">All months</option>
        </Select>
      </Field>
      {scope === "month" ? (<Field label="Month"><Select value={month} onChange={(e) => set("month", e.target.value)}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select></Field>) : <div />}
      {scope !== "all" ? (<Field label={scope === "fy" ? "FY starting" : "Year"}><Select value={year} onChange={(e) => set("year", e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</Select></Field>) : <div />}
      <Field label="Customer">
        <Select value={sp.get("customer") ?? ""} onChange={(e) => set("customer", e.target.value)}>
          <option value="">All customers</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      {showFreelancer ? (<Field label="Freelancer">
          <Select value={sp.get("freelancer") ?? ""} onChange={(e) => set("freelancer", e.target.value)}>
            <option value="">All freelancers</option>{freelancers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>) : null}
    </CardBody></Card>);
}
