import "./globals.css";
export const metadata = { title: "Invoicify", description: "GST export invoicing & USD→INR reconciliation" };
export default function RootLayout({ children }) {
    return <html lang="en"><body className="min-h-screen antialiased">{children}</body></html>;
}
