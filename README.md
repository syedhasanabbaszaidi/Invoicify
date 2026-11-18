# Invoicify
Multi-freelancer Indian GST export invoicing (LUT, zero-rated) and USD→INR remittance reconciliation.
Next.js 15 (React 19) · Drizzle + Neon · Auth.js v5 · @react-pdf/renderer + pdf-lib · Vercel Blob.

```bash
nvm use 22 && npm install
cp .env.example .env.local   # fill values
npx drizzle-kit push && npm run dev
```
Open /login → "Seed Demo Data" (dev only). See DEPLOYMENT.md for Neon/Vercel/Git.
