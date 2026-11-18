import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { listCustomers, listFreelancers, listServices } from "@/lib/queries";
import { Wizard } from "./wizard";
export default async function GeneratePage() {
    const u = await requireAdmin();
    const [customers, freelancers, services, existing] = await Promise.all([
        listCustomers(true), listFreelancers(u, false), listServices(true),
        db.select({ freelancerId: invoices.freelancerId, invoiceNumber: invoices.invoiceNumber, month: invoices.billingMonth, year: invoices.billingYear, status: invoices.status }).from(invoices),
    ]);
    return (<div className="space-y-4">
      <div><h1 className="text-xl font-semibold">Batch Billing Wizard</h1><p className="text-sm text-muted-foreground">Generate month-end export invoices for multiple freelancers in one go.</p></div>
      <Wizard customers={customers} freelancers={freelancers} services={services} existing={existing}/>
    </div>);
}
