import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, freelancers, freelancerBankProfiles, customers, serviceItemMasters, invoices, invoiceLineItems, remittanceReconciliations, } from "./schema";
import { lutDeclaration } from "../lib/utils";
const intermediary = {
    intermediaryBankName: "J.P. Morgan Chase Bank N.A., New York",
    intermediarySwift: "CHASUS33",
    chipsUid: "0002",
    fedAbaRouting: "0210-0002-1",
    nostroAccountNumber: "11407376 (Nostro Account of Axis Bank, Mumbai - SWIFT: AXISINBB)",
};
const sample = [
    { fullName: "Rahul Sharma", prefix: "RS/SA", gstin: "09BRLPS5237E1ZF", pan: "BRLPS5237E", acct: "918020012345678", ifsc: "UTIB0001234", usd: 1750 },
    { fullName: "Priya Verma", prefix: "PV/SA", gstin: "09AKLPV4412F1ZK", pan: "AKLPV4412F", acct: "918020098765432", ifsc: "UTIB0001234", usd: 2400 },
    { fullName: "Amit Khanna", prefix: "AK/SA", gstin: "09CDEPK7781H1ZP", pan: "CDEPK7781H", acct: "918020055512345", ifsc: "UTIB0001234", usd: 2100 },
];
export async function seedAdmin() {
    const email = (process.env.ADMIN_SEED_EMAIL ?? "admin@invoicify.local").toLowerCase();
    const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length)
        return { email, created: false };
    await db.insert(users).values({ name: "Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN" });
    return { email, created: true };
}
export async function seedDemo() {
    const admin = await seedAdmin();
    const hasData = (await db.select({ id: freelancers.id }).from(freelancers).limit(1)).length > 0;
    if (hasData)
        return { ...admin, demo: "already seeded" };
    const [adminUser] = await db.select().from(users).where(eq(users.email, admin.email));
    await db.insert(serviceItemMasters).values([
        { title: "Manual testing", descriptionLine: "Manual testing consultancy", category: "QA", defaultSacCode: "998313" },
        { title: "Test case review", descriptionLine: "Test cases review and consultancy SENDP", category: "QA", defaultSacCode: "998313" },
        { title: "Automation testing", descriptionLine: "Test automation scripting and maintenance", category: "QA", defaultSacCode: "998313" },
        { title: "React configuration", descriptionLine: "SENDP React configuration", category: "DEV", defaultSacCode: "998313" },
        { title: "React development", descriptionLine: "React front-end development services", category: "DEV", defaultSacCode: "998314" },
        { title: "API development", descriptionLine: "Back-end API development and integration", category: "DEV", defaultSacCode: "998314" },
        { title: "CI/CD setup", descriptionLine: "CI/CD pipeline setup and cloud deployment support", category: "DEVOPS", defaultSacCode: "998315" },
        { title: "Technical consulting", descriptionLine: "Software implementation consultancy", category: "CONSULTING", defaultSacCode: "998313" },
    ]);
    const [kwantu] = await db.insert(customers).values({
        companyName: "Kwantu Information Technology", addressLine1: "Unit 4, 12 Dorp Street", addressLine2: "Stellenbosch Central",
        city: "Stellenbosch", stateProvince: "Western Cape", postalCode: "7700", country: "South Africa",
        stateCode: "WC", taxIdOrGstin: "ZA-4590123456", billingEmail: "accounts@kwantu.example", defaultCurrency: "USD",
        paymentTermsNotes: "Payment within 30 days of invoice date.",
    }).returning();
    for (const [i, s] of sample.entries()) {
        const [f] = await db.insert(freelancers).values({
            fullName: s.fullName, email: `${s.fullName.split(" ")[0].toLowerCase()}@example.com`, phone: `+91 98100 0000${i}`,
            addressLine1: `B-${10 + i}, Sector 62`, addressLine2: "Near Metro Station", city: "Noida", state: "Uttar Pradesh", pincode: "201301",
            gstin: s.gstin, pan: s.pan, lutNumber: `AD0910260${i}12345K`, lutFinancialYear: "2026-27",
            invoicePrefix: s.prefix, nextSequenceNumber: 1, defaultSacCode: "998313",
            jurisdictionCity: "Gautam Buddh Nagar (Noida)",
        }).returning();
        await db.insert(freelancerBankProfiles).values({
            freelancerId: f.id, ...intermediary,
            beneficiaryBankName: "Axis Bank Ltd.", beneficiaryBranchAddress: "Sector-62, Noida", beneficiarySwift: "AXISINBB723",
            beneficiaryIfsc: s.ifsc, accountHolderName: s.fullName, accountNumber: s.acct,
            accountHolderAddress: `B-${10 + i}, Sector 62, Noida, Uttar Pradesh 201301, India`,
            purposeCode: "P0802", purposeDescription: "Software implementation/consultancy (other than those covered in SOFTEX form)",
        });
        // One historical, fully reconciled invoice for September 2026 (first two freelancers) to populate the dashboard.
        if (i < 2) {
            const [bank] = await db.select().from(freelancerBankProfiles).where(eq(freelancerBankProfiles.freelancerId, f.id));
            const { id: _id, freelancerId: _fid, updatedAt: _u, ...snap } = bank;
            const [inv] = await db.insert(invoices).values({
                invoiceNumber: `${s.prefix}/09/2026`, freelancerId: f.id, customerId: kwantu.id, billingMonth: 9, billingYear: 2026,
                invoiceDate: "2026-09-28", countryOfSupply: kwantu.country, subtotalUsd: s.usd.toFixed(2), totalUsd: s.usd.toFixed(2),
                lutDeclarationText: lutDeclaration(f.lutNumber, f.lutFinancialYear), bankSnapshotJson: snap,
                status: "PAID", createdByUserId: adminUser.id,
            }).returning();
            await db.insert(invoiceLineItems).values([
                { invoiceId: inv.id, sortOrder: 0, description: "Manual testing consultancy", sacCode: "998313", amountUsd: s.usd.toFixed(2) },
                { invoiceId: inv.id, sortOrder: 1, description: "Test cases review and consultancy SENDP", sacCode: "998313", amountUsd: null },
            ]);
            const received = s.usd - 35, rate = 83.9125 + i * 0.12;
            const gross = Math.round(received * rate * 100) / 100;
            await db.insert(remittanceReconciliations).values({
                invoiceId: inv.id, receivedDate: "2026-10-09", invoicedUsd: s.usd.toFixed(2), receivedUsd: received.toFixed(2),
                bankChargesUsd: "35.00", exchangeRateInr: rate.toFixed(4), grossInrAmount: gross.toFixed(2), bankInrDeductions: "590.00",
                netInrCredited: (gross - 590).toFixed(2), fircNumber: `FIRC/2026/${1000 + i}`, bankReferenceNumber: `AXISINW26${4410 + i}`,
                notes: "Seed data", reconciledByUserId: adminUser.id,
            });
            await db.update(freelancers).set({ nextSequenceNumber: 2 }).where(eq(freelancers.id, f.id));
        }
    }
    return { ...admin, demo: "seeded" };
}
