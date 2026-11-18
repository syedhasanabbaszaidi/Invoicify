import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildPdfDataForInvoice } from "@/lib/pdf/build-data";
import { generateInvoicePdf } from "@/lib/pdf/invoice-generator";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req, { params }) {
    const session = await auth();
    if (!session?.user)
        return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;
    const built = await buildPdfDataForInvoice(Number(id));
    if (!built)
        return new NextResponse("Not found", { status: 404 });
    if (session.user.role !== "ADMIN" && session.user.freelancerId !== built.freelancerId)
        return new NextResponse("Forbidden", { status: 403 });
    const pdf = await generateInvoicePdf(built.data);
    const download = new URL(req.url).searchParams.get("download") === "1";
    const fname = built.data.invoiceNumber.replace(/[^A-Za-z0-9_-]+/g, "_") + ".pdf";
    return new NextResponse(new Uint8Array(pdf), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fname}"`, "Cache-Control": "private, no-store" },
    });
}
