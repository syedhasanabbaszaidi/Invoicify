"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { invoices, invoiceLineItems, freelancers, freelancerBankProfiles, customers, remittanceReconciliations, } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { batchInvoiceSchema, invoiceEditSchema, remittanceSchema, } from "@/lib/validation";
import { lutDeclaration, num, round2 } from "@/lib/utils";
import { run } from "./result";
function sumLines(lines) {
    return round2(lines.reduce((a, l) => a + (l.amountUsd ?? 0), 0));
}
/** Atomically creates one invoice per selected freelancer and bumps each freelancer's sequence counter. */
export async function generateInvoices(input) {
    return run(async () => {
        const admin = await requireAdmin();
        const v = batchInvoiceSchema.parse(input);
        const ids = v.items.map((i) => i.freelancerId);
        if (new Set(ids).size !== ids.length)
            throw new Error("A freelancer appears more than once in this batch");
        const numbers = v.items.map((i) => `${i.freelancerId}|${i.invoiceNumber}`);
        if (new Set(numbers).size !== numbers.length)
            throw new Error("Duplicate invoice numbers in batch");
        const created = await db.transaction(async (tx) => {
            const [cust] = await tx.select().from(customers).where(eq(customers.id, v.customerId));
            if (!cust)
                throw new Error("Customer not found");
            const out = [];
            for (const item of v.items) {
                const [f] = await tx.select().from(freelancers).where(eq(freelancers.id, item.freelancerId));
                if (!f || !f.isActive)
                    throw new Error(`Freelancer ${item.freelancerId} not found or inactive`);
                const total = sumLines(item.lines);
                if (total <= 0)
                    throw new Error(`${f.fullName}: total USD must be greater than 0`);
                if (item.lines[0].amountUsd == null)
                    throw new Error(`${f.fullName}: the first line must carry the billed amount`);
                const dup = await tx.select({ id: invoices.id }).from(invoices)
                    .where(and(eq(invoices.freelancerId, f.id), eq(invoices.invoiceNumber, item.invoiceNumber)));
                if (dup.length)
                    throw new Error(`Invoice number ${item.invoiceNumber} already exists for ${f.fullName}`);
                const [bank] = await tx.select().from(freelancerBankProfiles).where(eq(freelancerBankProfiles.freelancerId, f.id));
                const snapshot = bank ? (({ id: _i, freelancerId: _f, updatedAt: _u, ...rest }) => rest)(bank) : null;
                const [inv] = await tx.insert(invoices).values({
                    invoiceNumber: item.invoiceNumber, freelancerId: f.id, customerId: cust.id,
                    billingMonth: v.month, billingYear: v.year, invoiceDate: v.invoiceDate,
                    countryOfSupply: cust.country, currency: cust.defaultCurrency,
                    subtotalUsd: total.toFixed(2), totalUsd: total.toFixed(2),
                    lutDeclarationText: lutDeclaration(f.lutNumber, f.lutFinancialYear),
                    bankSnapshotJson: snapshot, status: "ISSUED", createdByUserId: admin.uid,
                }).returning({ id: invoices.id });
                await tx.insert(invoiceLineItems).values(item.lines.map((l, idx) => ({
                    invoiceId: inv.id, sortOrder: idx, description: l.description, sacCode: l.sacCode,
                    amountUsd: l.amountUsd == null ? null : l.amountUsd.toFixed(2),
                })));
                await tx.update(freelancers).set({ nextSequenceNumber: sql `${freelancers.nextSequenceNumber} + 1`, updatedAt: new Date() })
                    .where(eq(freelancers.id, f.id));
                out.push({ invoiceId: inv.id, invoiceNumber: item.invoiceNumber, freelancerId: f.id });
            }
            return out;
        });
        revalidatePath("/dashboard");
        revalidatePath("/invoices");
        return created;
    });
}
export async function checkInvoiceNumber(freelancerId, invoiceNumber) {
    return run(async () => {
        await requireAdmin();
        const r = await db.select({ id: invoices.id }).from(invoices)
            .where(and(eq(invoices.freelancerId, freelancerId), eq(invoices.invoiceNumber, invoiceNumber.trim())));
        return { taken: r.length > 0 };
    });
}
/** Edit invoice date + lines. Allowed only before any payment is recorded. */
export async function updateInvoice(input) {
    return run(async () => {
        await requireAdmin();
        const v = invoiceEditSchema.parse(input);
        await db.transaction(async (tx) => {
            const [inv] = await tx.select().from(invoices).where(eq(invoices.id, v.invoiceId));
            if (!inv)
                throw new Error("Invoice not found");
            if (inv.status === "CANCELLED")
                throw new Error("Cancelled invoices cannot be edited");
            const recon = await tx.select({ id: remittanceReconciliations.id }).from(remittanceReconciliations).where(eq(remittanceReconciliations.invoiceId, inv.id));
            if (recon.length)
                throw new Error("Remove recorded remittances before editing this invoice");
            const total = sumLines(v.lines);
            if (total <= 0 || v.lines[0].amountUsd == null)
                throw new Error("First line must carry a positive amount");
            await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, inv.id));
            await tx.insert(invoiceLineItems).values(v.lines.map((l, i) => ({
                invoiceId: inv.id, sortOrder: i, description: l.description, sacCode: l.sacCode, amountUsd: l.amountUsd == null ? null : l.amountUsd.toFixed(2),
            })));
            await tx.update(invoices).set({
                invoiceDate: v.invoiceDate, subtotalUsd: total.toFixed(2), totalUsd: total.toFixed(2), pdfUrl: null, updatedAt: new Date(),
            }).where(eq(invoices.id, inv.id));
        });
        revalidatePath(`/invoices/${v.invoiceId}`);
        revalidatePath("/invoices");
        revalidatePath("/dashboard");
    });
}
export async function setInvoiceCancelled(invoiceId, cancelled) {
    return run(async () => {
        await requireAdmin();
        const recon = await db.select({ id: remittanceReconciliations.id }).from(remittanceReconciliations).where(eq(remittanceReconciliations.invoiceId, invoiceId));
        if (cancelled && recon.length)
            throw new Error("Cannot cancel an invoice with recorded remittances");
        await db.update(invoices).set({ status: cancelled ? "CANCELLED" : "ISSUED", updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/dashboard");
        revalidatePath("/invoices");
    });
}
async function refreshStatus(tx, invoiceId) {
    const [inv] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId));
    const rows = await tx.select().from(remittanceReconciliations).where(eq(remittanceReconciliations.invoiceId, invoiceId));
    const settled = round2(rows.reduce((a, r) => a + num(r.invoicedUsd), 0));
    const status = settled <= 0 ? "ISSUED" : settled + 0.005 >= num(inv.totalUsd) ? "PAID" : "PARTIALLY_PAID";
    await tx.update(invoices).set({ status, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
}
export async function recordRemittance(input) {
    return run(async () => {
        const admin = await requireAdmin();
        const v = remittanceSchema.parse(input);
        await db.transaction(async (tx) => {
            const [inv] = await tx.select().from(invoices).where(eq(invoices.id, v.invoiceId));
            if (!inv)
                throw new Error("Invoice not found");
            if (inv.status === "CANCELLED" || inv.status === "DRAFT")
                throw new Error("Invoice must be issued to record a payment");
            const prior = await tx.select().from(remittanceReconciliations).where(eq(remittanceReconciliations.invoiceId, inv.id));
            const outstanding = round2(num(inv.totalUsd) - prior.reduce((a, r) => a + num(r.invoicedUsd), 0));
            if (v.invoicedUsd > outstanding + 0.005)
                throw new Error(`Settled invoice amount exceeds outstanding balance (${outstanding.toFixed(2)})`);
            const bankChargesUsd = round2(v.invoicedUsd - v.receivedUsd);
            const gross = round2(v.receivedUsd * v.exchangeRateInr);
            if (v.bankInrDeductions > gross)
                throw new Error("INR deductions exceed gross credit");
            await tx.insert(remittanceReconciliations).values({
                invoiceId: inv.id, receivedDate: v.receivedDate,
                invoicedUsd: v.invoicedUsd.toFixed(2), receivedUsd: v.receivedUsd.toFixed(2), bankChargesUsd: bankChargesUsd.toFixed(2),
                exchangeRateInr: v.exchangeRateInr.toFixed(4), grossInrAmount: gross.toFixed(2),
                bankInrDeductions: v.bankInrDeductions.toFixed(2), netInrCredited: round2(gross - v.bankInrDeductions).toFixed(2),
                fircNumber: v.fircNumber, bankReferenceNumber: v.bankReferenceNumber, notes: v.notes, reconciledByUserId: admin.uid,
            });
            await refreshStatus(tx, inv.id);
        });
        revalidatePath(`/invoices/${v.invoiceId}`);
        revalidatePath("/dashboard");
        revalidatePath("/invoices");
    });
}
export async function deleteRemittance(reconId) {
    return run(async () => {
        await requireAdmin();
        const [r] = await db.select().from(remittanceReconciliations).where(eq(remittanceReconciliations.id, reconId));
        if (!r)
            throw new Error("Not found");
        await db.transaction(async (tx) => {
            await tx.delete(remittanceReconciliations).where(eq(remittanceReconciliations.id, reconId));
            await refreshStatus(tx, r.invoiceId);
        });
        revalidatePath(`/invoices/${r.invoiceId}`);
        revalidatePath("/dashboard");
        revalidatePath("/invoices");
    });
}
