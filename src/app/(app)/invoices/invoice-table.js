"use client";
import Link from "next/link";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { Select, StatusBadge } from "@/components/ui";
import { MONTHS, fmtInr, fmtUsd } from "@/lib/utils";
export function InvoiceTable({ rows }) {
    const [status, setStatus] = React.useState("");
    const data = React.useMemo(() => rows.filter((r) => !status || r.status === status), [rows, status]);
    const columns = React.useMemo(() => [
        { accessorKey: "invoiceNumber", header: "Invoice #", cell: ({ row }) => <Link className="text-primary hover:underline" href={`/invoices/${row.original.id}`}>{row.original.invoiceNumber}</Link> },
        { accessorKey: "freelancerName", header: "Freelancer" },
        { accessorKey: "customerName", header: "Customer" },
        { id: "period", header: "Period", accessorFn: (r) => r.billingYear * 100 + r.billingMonth, cell: ({ row }) => `${MONTHS[row.original.billingMonth - 1].slice(0, 3)} ${row.original.billingYear}` },
        { accessorKey: "totalUsd", header: "Billed", cell: ({ getValue }) => fmtUsd(getValue()) },
        { accessorKey: "receivedUsd", header: "Received", cell: ({ getValue }) => (getValue() ? fmtUsd(getValue()) : "—") },
        { accessorKey: "netInr", header: "Net INR", cell: ({ getValue }) => (getValue() ? fmtInr(getValue()) : "—") },
        { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()}/> },
    ], []);
    return (<div className="space-y-3">
      <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </Select>
      <DataTable data={data} columns={columns} searchPlaceholder="Search invoice, freelancer, customer…" empty="No invoices found"/>
    </div>);
}
