"use server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customers, freelancers, freelancerBankProfiles, serviceItemMasters, users } from "@/db/schema";
import { requireAdmin, requireUser, assertFreelancerAccess } from "@/lib/session";
import { freelancerSchema, bankProfileSchema, customerSchema, serviceSchema, userCreateSchema, } from "@/lib/validation";
import { storeFile } from "@/lib/storage";
import { run } from "./result";
export async function saveFreelancer(input) {
    return run(async () => {
        const u = await requireUser();
        const v = freelancerSchema.parse(input);
        const { id, ...vals } = v;
        if (id) {
            assertFreelancerAccess(u, id);
            // Freelancers may not alter compliance-critical numbering / activation fields.
            const patch = u.role === "ADMIN" ? vals : (({ nextSequenceNumber: _a, invoicePrefix: _b, isActive: _c, gstin: _d, ...rest }) => rest)(vals);
            await db.update(freelancers).set({ ...patch, updatedAt: new Date() }).where(eq(freelancers.id, id));
            revalidatePath("/freelancers");
            return { id };
        }
        await requireAdmin();
        const [row] = await db.insert(freelancers).values(vals).returning({ id: freelancers.id });
        revalidatePath("/freelancers");
        return { id: row.id };
    });
}
export async function saveBankProfile(input) {
    return run(async () => {
        const u = await requireUser();
        const v = bankProfileSchema.parse(input);
        assertFreelancerAccess(u, v.freelancerId);
        await db.insert(freelancerBankProfiles).values(v).onConflictDoUpdate({
            target: freelancerBankProfiles.freelancerId, set: { ...v, updatedAt: new Date() },
        });
        revalidatePath(`/freelancers/${v.freelancerId}`);
    });
}
async function upload(formData, kind) {
    const u = await requireUser();
    const freelancerId = Number(formData.get("freelancerId"));
    assertFreelancerAccess(u, freelancerId);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
        throw new Error("Choose a file");
    if (kind === "signature" && file.type === "application/pdf")
        throw new Error("Signature must be PNG or JPEG");
    const url = await storeFile(file, kind === "signature" ? "signatures" : "bank-docs");
    if (kind === "signature") {
        await db.update(freelancers).set({ signatureImageUrl: url, updatedAt: new Date() }).where(eq(freelancers.id, freelancerId));
    }
    else {
        const [bp] = await db.select({ id: freelancerBankProfiles.id }).from(freelancerBankProfiles).where(eq(freelancerBankProfiles.freelancerId, freelancerId));
        if (!bp)
            throw new Error("Save the structured bank profile first");
        await db.update(freelancerBankProfiles).set({ uploadedBankDocUrl: url, updatedAt: new Date() }).where(eq(freelancerBankProfiles.freelancerId, freelancerId));
    }
    revalidatePath(`/freelancers/${freelancerId}`);
}
export const uploadSignature = async (fd) => run(() => upload(fd, "signature"));
export const uploadBankDoc = async (fd) => run(() => upload(fd, "bank"));
export async function removeUpload(freelancerId, kind) {
    return run(async () => {
        const u = await requireUser();
        assertFreelancerAccess(u, freelancerId);
        if (kind === "signature")
            await db.update(freelancers).set({ signatureImageUrl: null }).where(eq(freelancers.id, freelancerId));
        else
            await db.update(freelancerBankProfiles).set({ uploadedBankDocUrl: null, useUploadedDocForPage2: false }).where(eq(freelancerBankProfiles.freelancerId, freelancerId));
        revalidatePath(`/freelancers/${freelancerId}`);
    });
}
export async function saveCustomer(input) {
    return run(async () => {
        await requireAdmin();
        const { id, ...vals } = customerSchema.parse(input);
        if (id)
            await db.update(customers).set(vals).where(eq(customers.id, id));
        else
            await db.insert(customers).values(vals);
        revalidatePath("/customers");
    });
}
export async function saveService(input) {
    return run(async () => {
        await requireAdmin();
        const { id, ...vals } = serviceSchema.parse(input);
        if (id)
            await db.update(serviceItemMasters).set(vals).where(eq(serviceItemMasters.id, id));
        else
            await db.insert(serviceItemMasters).values(vals);
        revalidatePath("/services");
    });
}
export async function createUser(input) {
    return run(async () => {
        await requireAdmin();
        const v = userCreateSchema.parse(input);
        await db.insert(users).values({
            name: v.name, email: v.email.toLowerCase(), passwordHash: await bcrypt.hash(v.password, 10),
            role: v.role, freelancerId: v.role === "FREELANCER" ? v.freelancerId ?? null : null,
        });
        revalidatePath("/users");
    });
}
export async function setUserActive(userId, active) {
    return run(async () => {
        const me = await requireAdmin();
        if (me.uid === userId && !active)
            throw new Error("You cannot deactivate your own account");
        await db.update(users).set({ isActive: active }).where(eq(users.id, userId));
        revalidatePath("/users");
    });
}
export async function resetUserPassword(userId, password) {
    return run(async () => {
        await requireAdmin();
        if (password.length < 8)
            throw new Error("Min 8 characters");
        await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, userId));
    });
}
