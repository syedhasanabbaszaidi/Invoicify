import { pgTable, pgEnum, serial, text, varchar, integer, boolean, timestamp, date, numeric, jsonb, uniqueIndex, index, } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
export const roleEnum = pgEnum("role", ["ADMIN", "FREELANCER"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"]);
export const serviceCategoryEnum = pgEnum("service_category", ["QA", "DEV", "DEVOPS", "CONSULTING"]);
export const freelancers = pgTable("freelancers", {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    tradeName: varchar("trade_name", { length: 200 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    pincode: varchar("pincode", { length: 12 }).notNull(),
    gstin: varchar("gstin", { length: 15 }).notNull(),
    pan: varchar("pan", { length: 10 }).notNull(),
    lutNumber: varchar("lut_number", { length: 80 }).notNull(),
    lutFinancialYear: varchar("lut_financial_year", { length: 9 }).notNull(),
    invoicePrefix: varchar("invoice_prefix", { length: 40 }).notNull(),
    nextSequenceNumber: integer("next_sequence_number").notNull().default(1),
    defaultSacCode: varchar("default_sac_code", { length: 10 }).notNull().default("998313"),
    jurisdictionCity: varchar("jurisdiction_city", { length: 150 }).notNull(),
    signatureImageUrl: text("signature_image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("freelancers_gstin_uq").on(t.gstin)]);
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("FREELANCER"),
    freelancerId: integer("freelancer_id").references(() => freelancers.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);
export const freelancerBankProfiles = pgTable("freelancer_bank_profiles", {
    id: serial("id").primaryKey(),
    freelancerId: integer("freelancer_id").notNull().references(() => freelancers.id, { onDelete: "cascade" }),
    intermediaryBankName: varchar("intermediary_bank_name", { length: 255 }),
    intermediarySwift: varchar("intermediary_swift", { length: 20 }),
    chipsUid: varchar("chips_uid", { length: 20 }),
    fedAbaRouting: varchar("fed_aba_routing", { length: 30 }),
    nostroAccountNumber: varchar("nostro_account_number", { length: 255 }),
    beneficiaryBankName: varchar("beneficiary_bank_name", { length: 255 }).notNull(),
    beneficiaryBranchAddress: varchar("beneficiary_branch_address", { length: 255 }),
    beneficiarySwift: varchar("beneficiary_swift", { length: 20 }),
    beneficiaryIfsc: varchar("beneficiary_ifsc", { length: 20 }),
    accountHolderName: varchar("account_holder_name", { length: 200 }).notNull(),
    accountNumber: varchar("account_number", { length: 40 }).notNull(),
    accountHolderAddress: varchar("account_holder_address", { length: 400 }),
    purposeCode: varchar("purpose_code", { length: 10 }).notNull().default("P0802"),
    purposeDescription: varchar("purpose_description", { length: 255 }).notNull()
        .default("Software implementation/consultancy (other than those covered in SOFTEX form)"),
    uploadedBankDocUrl: text("uploaded_bank_doc_url"),
    useUploadedDocForPage2: boolean("use_uploaded_doc_for_page2").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("bank_profile_freelancer_uq").on(t.freelancerId)]);
export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    stateProvince: varchar("state_province", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }).notNull(),
    stateCode: varchar("state_code", { length: 20 }),
    taxIdOrGstin: varchar("tax_id_or_gstin", { length: 60 }),
    billingEmail: varchar("billing_email", { length: 255 }),
    defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("USD"),
    paymentTermsNotes: text("payment_terms_notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const serviceItemMasters = pgTable("service_item_masters", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 150 }).notNull(),
    descriptionLine: text("description_line").notNull(),
    defaultSacCode: varchar("default_sac_code", { length: 10 }).notNull().default("998313"),
    category: serviceCategoryEnum("category").notNull().default("QA"),
    isActive: boolean("is_active").notNull().default(true),
});
export const invoices = pgTable("invoices", {
    id: serial("id").primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 60 }).notNull(),
    freelancerId: integer("freelancer_id").notNull().references(() => freelancers.id),
    customerId: integer("customer_id").notNull().references(() => customers.id),
    billingMonth: integer("billing_month").notNull(),
    billingYear: integer("billing_year").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    placeOfSupply: varchar("place_of_supply", { length: 100 }).notNull().default("Outside India"),
    countryOfSupply: varchar("country_of_supply", { length: 100 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    subtotalUsd: numeric("subtotal_usd", { precision: 12, scale: 2 }).notNull(),
    cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),
    lutDeclarationText: text("lut_declaration_text").notNull(),
    bankSnapshotJson: jsonb("bank_snapshot_json").$type(),
    status: invoiceStatusEnum("status").notNull().default("ISSUED"),
    pdfUrl: text("pdf_url"),
    createdByUserId: integer("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
    uniqueIndex("invoices_freelancer_number_uq").on(t.freelancerId, t.invoiceNumber),
    index("invoices_period_idx").on(t.billingYear, t.billingMonth),
    index("invoices_customer_idx").on(t.customerId),
    index("invoices_status_idx").on(t.status),
]);
export const invoiceLineItems = pgTable("invoice_line_items", {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description").notNull(),
    sacCode: varchar("sac_code", { length: 10 }).notNull(),
    amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }),
}, (t) => [index("line_items_invoice_idx").on(t.invoiceId)]);
export const remittanceReconciliations = pgTable("remittance_reconciliations", {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    receivedDate: date("received_date").notNull(),
    invoicedUsd: numeric("invoiced_usd", { precision: 12, scale: 2 }).notNull(),
    receivedUsd: numeric("received_usd", { precision: 12, scale: 2 }).notNull(),
    bankChargesUsd: numeric("bank_charges_usd", { precision: 12, scale: 2 }).notNull(),
    exchangeRateInr: numeric("exchange_rate_inr", { precision: 10, scale: 4 }).notNull(),
    grossInrAmount: numeric("gross_inr_amount", { precision: 14, scale: 2 }).notNull(),
    bankInrDeductions: numeric("bank_inr_deductions", { precision: 12, scale: 2 }).notNull().default("0"),
    netInrCredited: numeric("net_inr_credited", { precision: 14, scale: 2 }).notNull(),
    fircNumber: varchar("firc_number", { length: 80 }),
    bankReferenceNumber: varchar("bank_reference_number", { length: 80 }),
    notes: text("notes"),
    reconciledByUserId: integer("reconciled_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("recon_invoice_idx").on(t.invoiceId)]);
export const freelancersRelations = relations(freelancers, ({ one, many }) => ({
    bankProfile: one(freelancerBankProfiles, { fields: [freelancers.id], references: [freelancerBankProfiles.freelancerId] }),
    invoices: many(invoices),
}));
export const bankProfilesRelations = relations(freelancerBankProfiles, ({ one }) => ({
    freelancer: one(freelancers, { fields: [freelancerBankProfiles.freelancerId], references: [freelancers.id] }),
}));
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    freelancer: one(freelancers, { fields: [invoices.freelancerId], references: [freelancers.id] }),
    customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
    lineItems: many(invoiceLineItems),
    reconciliations: many(remittanceReconciliations),
}));
export const lineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
    invoice: one(invoices, { fields: [invoiceLineItems.invoiceId], references: [invoices.id] }),
}));
export const reconRelations = relations(remittanceReconciliations, ({ one }) => ({
    invoice: one(invoices, { fields: [remittanceReconciliations.invoiceId], references: [invoices.id] }),
}));
