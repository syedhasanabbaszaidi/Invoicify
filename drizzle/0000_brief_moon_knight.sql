CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'FREELANCER');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('QA', 'DEV', 'DEVOPS', 'CONSULTING');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_province" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100) NOT NULL,
	"state_code" varchar(20),
	"tax_id_or_gstin" varchar(60),
	"billing_email" varchar(255),
	"default_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_terms_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_bank_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"intermediary_bank_name" varchar(255),
	"intermediary_swift" varchar(20),
	"chips_uid" varchar(20),
	"fed_aba_routing" varchar(30),
	"nostro_account_number" varchar(255),
	"beneficiary_bank_name" varchar(255) NOT NULL,
	"beneficiary_branch_address" varchar(255),
	"beneficiary_swift" varchar(20),
	"beneficiary_ifsc" varchar(20),
	"account_holder_name" varchar(200) NOT NULL,
	"account_number" varchar(40) NOT NULL,
	"account_holder_address" varchar(400),
	"purpose_code" varchar(10) DEFAULT 'P0802' NOT NULL,
	"purpose_description" varchar(255) DEFAULT 'Software implementation/consultancy (other than those covered in SOFTEX form)' NOT NULL,
	"uploaded_bank_doc_url" text,
	"use_uploaded_doc_for_page2" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"trade_name" varchar(200),
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(12) NOT NULL,
	"gstin" varchar(15) NOT NULL,
	"pan" varchar(10) NOT NULL,
	"lut_number" varchar(80) NOT NULL,
	"lut_financial_year" varchar(9) NOT NULL,
	"invoice_prefix" varchar(40) NOT NULL,
	"next_sequence_number" integer DEFAULT 1 NOT NULL,
	"default_sac_code" varchar(10) DEFAULT '998313' NOT NULL,
	"jurisdiction_city" varchar(150) NOT NULL,
	"signature_image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"sac_code" varchar(10) NOT NULL,
	"amount_usd" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(60) NOT NULL,
	"freelancer_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"billing_month" integer NOT NULL,
	"billing_year" integer NOT NULL,
	"invoice_date" date NOT NULL,
	"place_of_supply" varchar(100) DEFAULT 'Outside India' NOT NULL,
	"country_of_supply" varchar(100) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"subtotal_usd" numeric(12, 2) NOT NULL,
	"cgst_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"cgst_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sgst_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"sgst_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"igst_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"igst_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_usd" numeric(12, 2) NOT NULL,
	"lut_declaration_text" text NOT NULL,
	"bank_snapshot_json" jsonb,
	"status" "invoice_status" DEFAULT 'ISSUED' NOT NULL,
	"pdf_url" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remittance_reconciliations" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"received_date" date NOT NULL,
	"invoiced_usd" numeric(12, 2) NOT NULL,
	"received_usd" numeric(12, 2) NOT NULL,
	"bank_charges_usd" numeric(12, 2) NOT NULL,
	"exchange_rate_inr" numeric(10, 4) NOT NULL,
	"gross_inr_amount" numeric(14, 2) NOT NULL,
	"bank_inr_deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_inr_credited" numeric(14, 2) NOT NULL,
	"firc_number" varchar(80),
	"bank_reference_number" varchar(80),
	"notes" text,
	"reconciled_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_item_masters" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(150) NOT NULL,
	"description_line" text NOT NULL,
	"default_sac_code" varchar(10) DEFAULT '998313' NOT NULL,
	"category" "service_category" DEFAULT 'QA' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'FREELANCER' NOT NULL,
	"freelancer_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "freelancer_bank_profiles" ADD CONSTRAINT "freelancer_bank_profiles_freelancer_id_freelancers_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_freelancer_id_freelancers_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_reconciliations" ADD CONSTRAINT "remittance_reconciliations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_reconciliations" ADD CONSTRAINT "remittance_reconciliations_reconciled_by_user_id_users_id_fk" FOREIGN KEY ("reconciled_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_freelancer_id_freelancers_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_profile_freelancer_uq" ON "freelancer_bank_profiles" USING btree ("freelancer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "freelancers_gstin_uq" ON "freelancers" USING btree ("gstin");--> statement-breakpoint
CREATE INDEX "line_items_invoice_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_freelancer_number_uq" ON "invoices" USING btree ("freelancer_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_period_idx" ON "invoices" USING btree ("billing_year","billing_month");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recon_invoice_idx" ON "remittance_reconciliations" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");