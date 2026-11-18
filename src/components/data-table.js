"use client";
import * as React from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui";
export function DataTable({ data, columns, searchPlaceholder = "Search…", empty = "No records" }) {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const table = useReactTable({
        data, columns, state: { sorting, globalFilter }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    });
    return (<div className="space-y-3">
      <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} className="max-w-xs"/>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (<tr key={hg.id}>
                {hg.headers.map((h) => (<th key={h.id} className="whitespace-nowrap px-3 py-2 font-medium">
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (<button className="inline-flex items-center gap-1" onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}<ArrowUpDown className="h-3 w-3"/>
                      </button>) : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>))}
              </tr>))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (<tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">{empty}</td></tr>) : table.getRowModel().rows.map((r) => (<tr key={r.id} className="border-t hover:bg-secondary/30">
                {r.getVisibleCells().map((c) => <td key={c.id} className="whitespace-nowrap px-3 py-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
