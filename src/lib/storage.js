import { put } from "@vercel/blob";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "application/pdf"];
/** Stores a file in Vercel Blob; falls back to a base64 data URL when no token is configured (local dev). */
export async function storeFile(file, folder) {
    if (!ALLOWED.includes(file.type))
        throw new Error("Only PNG, JPEG or PDF files are allowed");
    if (file.size > MAX_BYTES)
        throw new Error("File must be 4MB or smaller");
    const buf = Buffer.from(await file.arrayBuffer());
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const blob = await put(`${folder}/${Date.now()}-${safe}`, buf, { access: "public", contentType: file.type });
        return blob.url;
    }
    return `data:${file.type};base64,${buf.toString("base64")}`;
}
/** Loads bytes + mime type from either a data URL or an http(s) URL. */
export async function loadFileBytes(url) {
    if (url.startsWith("data:")) {
        const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
        if (!m)
            throw new Error("Malformed data URL");
        return { bytes: new Uint8Array(Buffer.from(m[2], "base64")), mime: m[1] };
    }
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Failed to fetch file (${res.status})`);
    return { bytes: new Uint8Array(await res.arrayBuffer()), mime: res.headers.get("content-type") ?? "application/octet-stream" };
}
