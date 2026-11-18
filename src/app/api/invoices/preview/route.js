import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { freelancers, freelancerBankProfiles, customers } from "@/db/schema";
import { generateInvoicePdf } from "@/lib/pdf/invoice-generator";
import { lineSchema } from "@/lib/validation";
import { lutDeclaration, round2 } from "@/lib/utils";
export const runtime = "nodejs";
export const maxDuration = 60;
const body = z.object({
    freelancerId: z.number().int(), customerId: z.number().int(), invoiceNumber: z.string().min(1),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), lines: z.array(lineSchema).min(1),
});
/** Unsaved live preview used by the billing wizard (admin only). */
export async function POST(req) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN")
        return new NextResponse("Forbidden", { status: 403 });
    const parsed = body.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    const v = parsed.data;
    const [f] = await db.select().from(freelancers).where(eq(freelancers.id, v.freelancerId));
    const [c] = await db.select().from(customers).where(eq(customers.id, v.customerId));
    const [b] = await db.select().from(freelancerBankProfiles).where(eq(freelancerBankProfiles.freelancerId, v.freelancerId));
    if (!f || !c)
        return new NextResponse("Not found", { status: 404 });
    const total = round2(v.lines.reduce((a, l) => a + (l.amountUsd ?? 0), 0));
    const pdf = await generateInvoicePdf({
        invoiceNumber: v.invoiceNumber, invoiceDate: v.invoiceDate, placeOfSupply: "Outside India", countryOfSupply: c.country, currency: c.defaultCurrency,
        supplier: { fullName: f.fullName, tradeName: f.tradeName, addressLine1: f.addressLine1, addressLine2: f.addressLine2, city: f.city, state: f.state, pincode: f.pincode, gstin: f.gstin, pan: f.pan, jurisdictionCity: f.jurisdictionCity, signatureImageUrl: f.signatureImageUrl },
        receiver: { companyName: c.companyName, addressLine1: c.addressLine1, addressLine2: c.addressLine2, city: c.city, stateProvince: c.stateProvince, postalCode: c.postalCode, country: c.country, stateCode: c.stateCode, taxIdOrGstin: c.taxIdOrGstin },
        lines: v.lines, subtotalUsd: total, totalUsd: total, lutDeclarationText: lutDeclaration(f.lutNumber, f.lutFinancialYear),
        bank: b ? (({ id: _i, freelancerId: _f, updatedAt: _u, ...rest }) => rest)(b) : null,
    });
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
}
