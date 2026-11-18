import { requireUser } from "@/lib/session";
import { listInvoices } from "@/lib/queries";
import { InvoiceTable } from "./invoice-table";
export default async function InvoicesPage() {
    const u = await requireUser();
    const rows = await listInvoices(u);
    return (<div className="space-y-4">
      <h1 className="text-xl font-semibold">Invoices</h1>
      <InvoiceTable rows={rows}/>
    </div>);
}
