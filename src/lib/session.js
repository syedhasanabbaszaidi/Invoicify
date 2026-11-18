import { redirect } from "next/navigation";
import { auth } from "@/auth";
export async function requireUser() {
    const s = await auth();
    if (!s?.user)
        redirect("/login");
    return { uid: s.user.uid, role: s.user.role, freelancerId: s.user.freelancerId, name: s.user.name ?? "" };
}
export async function requireAdmin() {
    const u = await requireUser();
    if (u.role !== "ADMIN")
        throw new Error("Forbidden: admin access required");
    return u;
}
/** Freelancers may only touch their own freelancer record. */
export function assertFreelancerAccess(u, freelancerId) {
    if (u.role !== "ADMIN" && u.freelancerId !== freelancerId)
        throw new Error("Forbidden");
}
