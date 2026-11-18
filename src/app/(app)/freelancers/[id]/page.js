import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getFreelancerWithBank } from "@/lib/queries";
import { FreelancerEditor } from "./editor";
export default async function FreelancerPage({ params }) {
    const u = await requireUser();
    const { id } = await params;
    if (id === "new") {
        if (u.role !== "ADMIN")
            notFound();
        return <FreelancerEditor admin freelancer={null} bank={null}/>;
    }
    const fid = Number(id);
    if (u.role !== "ADMIN" && u.freelancerId !== fid)
        notFound();
    const data = await getFreelancerWithBank(fid);
    if (!data)
        notFound();
    return <FreelancerEditor admin={u.role === "ADMIN"} freelancer={data.f} bank={data.bank}/>;
}
