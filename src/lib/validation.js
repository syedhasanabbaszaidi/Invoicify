import { z } from "zod";
const optStr = (max = 255) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));
const req = (max = 255) => z.string().trim().min(1, "Required").max(max);
export const gstinRe = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
export const panRe = /^[A-Z]{5}\d{4}[A-Z]$/;
export const freelancerSchema = z.object({
    id: z.number().int().optional(),
    fullName: req(200), tradeName: optStr(200),
    email: z.string().trim().email(), phone: optStr(40),
    addressLine1: req(), addressLine2: optStr(), city: req(100), state: req(100),
    pincode: z.string().trim().regex(/^\d{6}$/, "6-digit PIN"),
    gstin: z.string().trim().toUpperCase().regex(gstinRe, "Invalid GSTIN"),
    pan: z.string().trim().toUpperCase().regex(panRe, "Invalid PAN"),
    lutNumber: req(80), lutFinancialYear: z.string().trim().regex(/^\d{4}-\d{2}$/, "Use format 2026-27"),
    invoicePrefix: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9/_-]+$/, "Letters, digits, / _ - only"),
    nextSequenceNumber: z.coerce.number().int().min(1),
    defaultSacCode: z.string().trim().regex(/^\d{4,8}$/, "Numeric SAC"),
    jurisdictionCity: req(150), isActive: z.boolean().default(true),
});
export const bankProfileSchema = z.object({
    freelancerId: z.number().int(),
    intermediaryBankName: optStr(), intermediarySwift: optStr(20), chipsUid: optStr(20),
    fedAbaRouting: optStr(30), nostroAccountNumber: optStr(),
    beneficiaryBankName: req(), beneficiaryBranchAddress: optStr(), beneficiarySwift: optStr(20), beneficiaryIfsc: optStr(20),
    accountHolderName: req(200), accountNumber: req(40), accountHolderAddress: optStr(400),
    purposeCode: req(10), purposeDescription: req(),
    useUploadedDocForPage2: z.boolean().default(false),
});
export const customerSchema = z.object({
    id: z.number().int().optional(),
    companyName: req(), addressLine1: req(), addressLine2: optStr(), city: req(100),
    stateProvince: optStr(100), postalCode: optStr(20), country: req(100), stateCode: optStr(20),
    taxIdOrGstin: optStr(60), billingEmail: z.string().trim().email().optional().or(z.literal("")).transform((v) => v || null),
    defaultCurrency: z.string().trim().length(3).default("USD"), paymentTermsNotes: optStr(1000),
    isActive: z.boolean().default(true),
});
export const serviceSchema = z.object({
    id: z.number().int().optional(),
    title: req(150), descriptionLine: req(1000),
    defaultSacCode: z.string().trim().regex(/^\d{4,8}$/, "Numeric SAC"),
    category: z.enum(["QA", "DEV", "DEVOPS", "CONSULTING"]), isActive: z.boolean().default(true),
});
export const userCreateSchema = z.object({
    name: req(200), email: z.string().trim().email(),
    password: z.string().min(8, "Min 8 characters"),
    role: z.enum(["ADMIN", "FREELANCER"]), freelancerId: z.number().int().nullable().optional(),
}).refine((v) => v.role === "ADMIN" || !!v.freelancerId, { message: "Freelancer users must be linked to a freelancer", path: ["freelancerId"] });
export const lineSchema = z.object({
    description: req(1000),
    sacCode: z.string().trim().regex(/^\d{4,8}$/, "Numeric SAC"),
    amountUsd: z.number().nonnegative().nullable(),
});
export const batchInvoiceSchema = z.object({
    month: z.number().int().min(1).max(12), year: z.number().int().min(2017).max(2100),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), customerId: z.number().int(),
    customTerms: z.string().trim().max(1000).optional().nullable(),
    items: z.array(z.object({
        freelancerId: z.number().int(),
        invoiceNumber: z.string().trim().min(1).max(60),
        lines: z.array(lineSchema).min(1, "Add at least one work line"),
    })).min(1, "Select at least one freelancer"),
});
export const invoiceEditSchema = z.object({
    invoiceId: z.number().int(),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lines: z.array(lineSchema).min(1),
});
export const remittanceSchema = z.object({
    invoiceId: z.number().int(),
    receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    invoicedUsd: z.number().positive(),
    receivedUsd: z.number().positive(),
    exchangeRateInr: z.number().positive(),
    bankInrDeductions: z.number().min(0).default(0),
    fircNumber: optStr(80), bankReferenceNumber: z.string().trim().min(1, "Bank reference required").max(80),
    notes: optStr(1000),
}).refine((v) => v.receivedUsd <= v.invoicedUsd + 0.005, { message: "Received USD cannot exceed settled invoice USD", path: ["receivedUsd"] });
