import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { loadFileBytes } from "@/lib/storage";
import { InvoiceDocument } from "./invoice-document";
async function loadImage(url) {
    if (!url)
        return { img: null, isPdf: false };
    try {
        const { bytes, mime } = await loadFileBytes(url);
        if (mime.includes("pdf"))
            return { img: null, isPdf: true, pdfBytes: bytes };
        const format = mime.includes("png") ? "png" : "jpg";
        return { img: { data: Buffer.from(bytes), format }, isPdf: false };
    }
    catch {
        return { img: null, isPdf: false };
    }
}
/**
 * Generates the 2-page invoice PDF.
 *  - Page 1: GST export tax invoice (react-pdf).
 *  - Page 2: structured wire instructions (react-pdf), OR the freelancer's uploaded
 *    PDF merged in with pdf-lib, OR an uploaded image embedded on the Page 2 sheet.
 */
export async function generateInvoicePdf(data) {
    const sig = (await loadImage(data.supplier.signatureImageUrl)).img;
    const useUpload = !!(data.bank?.useUploadedDocForPage2 && data.bank.uploadedBankDocUrl);
    const up = useUpload ? await loadImage(data.bank.uploadedBankDocUrl) : { img: null, isPdf: false };
    const mergePdf = up.isPdf && !!up.pdfBytes;
    const base = await renderToBuffer(<InvoiceDocument data={data} signature={sig} bankImage={up.img} skipBankPage={mergePdf}/>);
    if (!mergePdf)
        return Buffer.from(base);
    const out = await PDFDocument.load(base);
    try {
        const bankDoc = await PDFDocument.load(up.pdfBytes, { ignoreEncryption: true });
        const pages = await out.copyPages(bankDoc, bankDoc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
    }
    catch {
        // Corrupt upload: fall back to the generated template for Page 2.
        return Buffer.from(await renderToBuffer(<InvoiceDocument data={data} signature={sig} bankImage={null} skipBankPage={false}/>));
    }
    return Buffer.from(await out.save());
}
export async function mergePdfs(buffers) {
    const out = await PDFDocument.create();
    for (const b of buffers) {
        const d = await PDFDocument.load(b);
        (await out.copyPages(d, d.getPageIndices())).forEach((p) => out.addPage(p));
    }
    return Buffer.from(await out.save());
}
