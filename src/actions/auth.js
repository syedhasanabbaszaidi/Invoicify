"use server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { seedDemo } from "@/db/seed";
import { run } from "./result";
export async function loginAction(email, password) {
    try {
        await signIn("credentials", { email, password, redirect: false });
        return { ok: true };
    }
    catch (e) {
        if (e instanceof AuthError)
            return { ok: false, error: "Invalid email or password" };
        throw e;
    }
}
export async function logoutAction() { await signOut({ redirectTo: "/login" }); }
/** Development-only helper: creates the admin + demo freelancers, Kwantu and sample invoices. */
export async function seedDemoAction() {
    return run(async () => {
        if (process.env.NODE_ENV === "production")
            throw new Error("Demo seeding is disabled in production");
        return seedDemo();
    });
}
