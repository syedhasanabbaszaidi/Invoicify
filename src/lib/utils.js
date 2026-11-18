import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i) => twMerge(clsx(i));
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const num = (v) => (v == null || v === "" ? 0 : Number(v));
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const fmtUsd = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num(v));
export const fmtInr = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num(v));
export function fmtDate(d) {
    if (!d)
        return "—";
    const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00Z" : "")) : d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
/** Indian financial year start year for a given month (1-12) and calendar year. Apr–Mar. */
export const fyStartYear = (month, year) => (month >= 4 ? year : year - 1);
export const fyLabel = (start) => `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function below1000(n) {
    const parts = [];
    if (n >= 100) {
        parts.push(ONES[Math.floor(n / 100)] + " Hundred");
        n %= 100;
    }
    if (n >= 20) {
        parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
    }
    else if (n > 0)
        parts.push(ONES[n]);
    return parts.join(" ");
}
/** "USD One Thousand Seven Hundred Fifty Only" (adds "and Thirty Cents" when needed). */
export function amountInWords(amount, currency = "USD") {
    const total = Math.round(amount * 100);
    const whole = Math.floor(total / 100);
    const cents = total % 100;
    const scales = [[1_000_000_000, "Billion"], [1_000_000, "Million"], [1_000, "Thousand"]];
    let rest = whole;
    const parts = [];
    for (const [v, name] of scales) {
        if (rest >= v) {
            parts.push(below1000(Math.floor(rest / v)) + " " + name);
            rest %= v;
        }
    }
    if (rest > 0)
        parts.push(below1000(rest));
    const words = parts.length ? parts.join(" ") : "Zero";
    return `${currency} ${words}${cents ? ` and ${below1000(cents)} Cents` : ""} Only`;
}
export const invoiceNumberFor = (prefix, month, year) => `${prefix}/${String(month).padStart(2, "0")}/${year}`;
export const LUT_CLAUSE = "Supply Meant For Export Under Bond Or Letter of Undertaking Without Payment Of Integrated Goods and Service Tax (IGST)";
export const lutDeclaration = (lutNumber, fy) => `${LUT_CLAUSE}. LUT No. ${lutNumber} for Financial Year ${fy}.`;
