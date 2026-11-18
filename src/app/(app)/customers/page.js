import { requireAdmin } from "@/lib/session";
import { listCustomers } from "@/lib/queries";
import { CustomersClient } from "./client";
export default async function CustomersPage() {
    await requireAdmin();
    return <CustomersClient rows={await listCustomers()}/>;
}
