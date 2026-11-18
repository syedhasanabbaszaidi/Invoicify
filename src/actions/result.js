import { ZodError } from "zod";
export async function run(fn) {
    try {
        return { ok: true, data: await fn() };
    }
    catch (e) {
        // Next.js redirect/notFound errors must propagate
        if (e && typeof e === "object" && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_"))
            throw e;
        if (e instanceof ZodError)
            return { ok: false, error: e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") };
        const msg = e instanceof Error ? e.message : "Unexpected error";
        if (/unique|duplicate key/i.test(msg))
            return { ok: false, error: "A record with the same unique value already exists (e.g. invoice number, GSTIN or email)." };
        return { ok: false, error: msg };
    }
}
