import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/auth";
import { buildPdfDataForInvoice } from "@/lib/pdf/build-data";
import { generateInvoicePdf } from "@/lib/pdf/invoice-generator";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(req) {
    const session = await auth();
    if (!session?.user)
        return new NextResponse("Unauthorized", { status: 401 });
    const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
    if (!ids.length)
        return new NextResponse("No ids", { status: 400 });
    const zip = new JSZip();
    for (const id of ids) {
        const built = await buildPdfDataForInvoice(id);
        if (!built)
            continue;
        if (session.user.role !== "ADMIN" && session.user.freelancerId !== built.freelancerId)
            continue;
        zip.file(`${built.data.invoiceNumber.replace(/[^A-Za-z0-9_-]+/g, "_")}.pdf`, await generateInvoicePdf(built.data));
    }
    const out = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(Buffer.from(out), {
        headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="invoices.zip"', "Cache-Control": "private, no-store" },
    });
}
