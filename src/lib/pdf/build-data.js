import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceLineItems, freelancers, customers } from "@/db/schema";
import { num } from "@/lib/utils";
export async function buildPdfDataForInvoice(invoiceId) {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!inv)
        return null;
    const [f] = await db.select().from(freelancers).where(eq(freelancers.id, inv.freelancerId));
    const [c] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
    const lines = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId)).orderBy(invoiceLineItems.sortOrder);
    return {
        freelancerId: f.id,
        data: {
            invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate, placeOfSupply: inv.placeOfSupply,
            countryOfSupply: inv.countryOfSupply, currency: inv.currency,
            supplier: {
                fullName: f.fullName, tradeName: f.tradeName, addressLine1: f.addressLine1, addressLine2: f.addressLine2,
                city: f.city, state: f.state, pincode: f.pincode, gstin: f.gstin, pan: f.pan,
                jurisdictionCity: f.jurisdictionCity, signatureImageUrl: f.signatureImageUrl,
            },
            receiver: {
                companyName: c.companyName, addressLine1: c.addressLine1, addressLine2: c.addressLine2, city: c.city,
                stateProvince: c.stateProvince, postalCode: c.postalCode, country: c.country, stateCode: c.stateCode, taxIdOrGstin: c.taxIdOrGstin,
            },
            lines: lines.map((l) => ({ description: l.description, sacCode: l.sacCode, amountUsd: l.amountUsd == null ? null : num(l.amountUsd) })),
            subtotalUsd: num(inv.subtotalUsd), totalUsd: num(inv.totalUsd),
            lutDeclarationText: inv.lutDeclarationText,
            bank: inv.bankSnapshotJson,
        },
    };
}
