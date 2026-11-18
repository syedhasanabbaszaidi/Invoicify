import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, freelancers, customers, remittanceReconciliations, invoiceLineItems, freelancerBankProfiles, serviceItemMasters, users, } from "@/db/schema";
import { fyStartYear, num, round2 } from "@/lib/utils";
/** Role scoping: freelancers only see their own invoices. */
function scope(u, f) {
    const c = [];
    const fid = u.role === "FREELANCER" ? u.freelancerId ?? -1 : f.freelancerId;
    if (fid)
        c.push(eq(invoices.freelancerId, fid));
    if (f.customerId)
        c.push(eq(invoices.customerId, f.customerId));
    if (f.year && f.month)
        c.push(and(eq(invoices.billingYear, f.year), eq(invoices.billingMonth, f.month)));
    if (f.fyStart) {
        c.push(sql `((${invoices.billingYear} = ${f.fyStart} AND ${invoices.billingMonth} >= 4) OR (${invoices.billingYear} = ${f.fyStart + 1} AND ${invoices.billingMonth} <= 3))`);
    }
    if (f.status)
        c.push(sql `${invoices.status} = ${f.status}`);
    return c;
}
export async function listInvoices(u, f = {}) {
    const conds = scope(u, f);
    const rows = await db.select({
        id: invoices.id, invoiceNumber: invoices.invoiceNumber, freelancerId: invoices.freelancerId, freelancerName: freelancers.fullName,
        customerId: invoices.customerId, customerName: customers.companyName, billingMonth: invoices.billingMonth,
        billingYear: invoices.billingYear, invoiceDate: invoices.invoiceDate, totalUsd: invoices.totalUsd, status: invoices.status,
    }).from(invoices)
        .innerJoin(freelancers, eq(freelancers.id, invoices.freelancerId))
        .innerJoin(customers, eq(customers.id, invoices.customerId))
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(invoices.billingYear), desc(invoices.billingMonth), invoices.invoiceNumber);
    if (!rows.length)
        return [];
    const recon = await db.select().from(remittanceReconciliations).where(inArray(remittanceReconciliations.invoiceId, rows.map((r) => r.id)));
    return rows.map((r) => {
        const rc = recon.filter((x) => x.invoiceId === r.id);
        const received = rc.reduce((a, x) => a + num(x.receivedUsd), 0);
        const gross = rc.reduce((a, x) => a + num(x.grossInrAmount), 0);
        return {
            ...r, totalUsd: num(r.totalUsd),
            receivedUsd: round2(received), settledUsd: round2(rc.reduce((a, x) => a + num(x.invoicedUsd), 0)),
            netInr: round2(rc.reduce((a, x) => a + num(x.netInrCredited), 0)), grossInr: round2(gross),
            bankChargesUsd: round2(rc.reduce((a, x) => a + num(x.bankChargesUsd), 0)),
            avgRate: received > 0 ? gross / received : null,
            lastReceivedDate: rc.map((x) => x.receivedDate).sort().at(-1) ?? null,
        };
    });
}
export async function getInvoiceDetail(u, id) {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!inv)
        return null;
    if (u.role === "FREELANCER" && inv.freelancerId !== u.freelancerId)
        return null;
    const [freelancer] = await db.select().from(freelancers).where(eq(freelancers.id, inv.freelancerId));
    const [customer] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
    const lines = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id)).orderBy(invoiceLineItems.sortOrder);
    const recons = await db.select().from(remittanceReconciliations).where(eq(remittanceReconciliations.invoiceId, id)).orderBy(remittanceReconciliations.receivedDate);
    return { inv, freelancer, customer, lines, recons };
}
export async function listFreelancers(u, includeInactive = true) {
    const conds = [];
    if (u.role === "FREELANCER")
        conds.push(eq(freelancers.id, u.freelancerId ?? -1));
    if (!includeInactive)
        conds.push(eq(freelancers.isActive, true));
    return db.select().from(freelancers).where(conds.length ? and(...conds) : undefined).orderBy(freelancers.fullName);
}
export const listCustomers = (activeOnly = false) => db.select().from(customers).where(activeOnly ? eq(customers.isActive, true) : undefined).orderBy(customers.companyName);
export const listServices = (activeOnly = false) => db.select().from(serviceItemMasters).where(activeOnly ? eq(serviceItemMasters.isActive, true) : undefined).orderBy(serviceItemMasters.category, serviceItemMasters.title);
export async function getFreelancerWithBank(id) {
    const [f] = await db.select().from(freelancers).where(eq(freelancers.id, id));
    if (!f)
        return null;
    const [bank] = await db.select().from(freelancerBankProfiles).where(eq(freelancerBankProfiles.freelancerId, id));
    return { f, bank: bank ?? null };
}
export const listUsers = () => db.select({ id: users.id, name: users.name, email: users.email, role: users.role, freelancerId: users.freelancerId, isActive: users.isActive, createdAt: users.createdAt })
    .from(users).orderBy(users.name);
export async function getDashboard(u, f) {
    const filters = f.allMonths ? { ...f, month: undefined, year: undefined } : f;
    const rows = (await listInvoices(u, filters)).filter((r) => r.status !== "CANCELLED");
    const billed = round2(rows.reduce((a, r) => a + r.totalUsd, 0));
    const realized = round2(rows.reduce((a, r) => a + r.receivedUsd, 0));
    const inr = round2(rows.reduce((a, r) => a + r.netInr, 0));
    const gross = rows.reduce((a, r) => a + r.grossInr, 0);
    const pending = round2(rows.reduce((a, r) => a + Math.max(0, r.totalUsd - r.settledUsd), 0));
    const kpis = { billed, realized, inr, pending, avgRate: realized > 0 ? gross / realized : null, bankCharges: round2(rows.reduce((a, r) => a + r.bankChargesUsd, 0)) };
    const roster = await listFreelancers(u, false);
    const consolidated = roster.map((fr) => ({ freelancer: fr, invoices: rows.filter((r) => r.freelancerId === fr.id) }));
    return { rows, kpis, consolidated };
}
/** Per-freelancer ledger incl. financial-year export turnover (₹20L GST threshold tracking). */
export async function getFreelancerLedger(u, freelancerId) {
    if (u.role === "FREELANCER" && u.freelancerId !== freelancerId)
        return null;
    const all = (await listInvoices(u, { freelancerId })).filter((r) => r.status !== "CANCELLED");
    const byFy = new Map();
    for (const r of all) {
        const k = fyStartYear(r.billingMonth, r.billingYear);
        const e = byFy.get(k) ?? { fyStart: k, billedUsd: 0, realizedUsd: 0, grossInr: 0, netInr: 0, pendingUsd: 0 };
        e.billedUsd += r.totalUsd;
        e.realizedUsd += r.receivedUsd;
        e.grossInr += r.grossInr;
        e.netInr += r.netInr;
        e.pendingUsd += Math.max(0, r.totalUsd - r.settledUsd);
        byFy.set(k, e);
    }
    return { invoices: all, fy: [...byFy.values()].sort((a, b) => b.fyStart - a.fyStart) };
}
