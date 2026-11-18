# Invoicify — Git, Neon, Vercel deployment

Requires Node 20+ (Vercel default is fine). Locally: `nvm use 22`.

## 1. Neon database
1. Create a project at https://console.neon.tech → copy the **pooled** connection string.
2. `cp .env.example .env.local` and fill `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`.
3. Create tables and the admin user:
   ```bash
   npx drizzle-kit push        # quick: sync schema to Neon
   npm run db:seed             # admin user + demo data (skip demo in prod, see below)
   ```
   For versioned migrations instead: `npm run db:generate` then `npm run db:migrate` and commit `drizzle/`.

## 2. Git → GitHub
```bash
git add -A && git commit -m "Initial Invoicify"
gh repo create invoicify --private --source=. --push      # or: git remote add origin <url> && git push -u origin main
```
`.env*` files are git-ignored; only `.env.example` is committed.

## 3. Vercel
1. https://vercel.com/new → import the GitHub repo (framework auto-detected as Next.js).
2. Environment variables (Production + Preview): `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`.
3. Storage tab → **Create Blob store** and connect it; this injects `BLOB_READ_WRITE_TOKEN` (signatures / bank PDFs).
   Alternative: Vercel's Neon integration (Storage → Neon) injects `DATABASE_URL` automatically.
4. Deploy. Or via CLI: `npm i -g vercel && vercel link && vercel --prod`.
5. Seed production admin once (from your machine, pointing at the Neon prod URL):
   `ADMIN_SEED_EMAIL=you@x.com ADMIN_SEED_PASSWORD='...' DATABASE_URL='<prod>' npx tsx -e "import('./src/db/seed.js').then(m=>m.seedAdmin()).then(console.log).then(()=>process.exit())"`
   The "Seed Demo Data" button is disabled when `NODE_ENV=production`.

Every push to `main` then auto-deploys; PRs get preview URLs. Schema changes: run `drizzle-kit migrate` against Neon before/after deploy.
