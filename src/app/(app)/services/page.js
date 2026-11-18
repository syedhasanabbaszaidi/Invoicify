import { requireAdmin } from "@/lib/session";
import { listServices } from "@/lib/queries";
import { ServicesClient } from "./client";
export default async function ServicesPage() {
    await requireAdmin();
    return <ServicesClient rows={await listServices()}/>;
}
