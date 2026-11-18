import { requireAdmin } from "@/lib/session";
import { listFreelancers, listUsers } from "@/lib/queries";
import { UsersClient } from "./client";
export default async function UsersPage() {
    const u = await requireAdmin();
    const [users, freelancers] = await Promise.all([listUsers(), listFreelancers(u)]);
    return <UsersClient users={users} meId={u.uid} freelancers={freelancers.map((f) => ({ id: f.id, name: f.fullName }))}/>;
}
