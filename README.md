# n8n Template Vault

Subscription site for ready-made n8n workflow templates. Buyers pay once (bKash/Nagad, verified by admin) for lifetime access, then copy any workflow and paste it into n8n with Ctrl+V.

**Stack:** Next.js 14 · Supabase (auth + Postgres) · Tailwind · Bangla/English UI

## Deploy on Vercel
1. Import this repo in Vercel (framework: Next.js). No extra settings needed: public Supabase values are in `.env.production`.
2. To change price, payment numbers or site name, add these in Vercel → Settings → Environment Variables (they override `.env.production`):
   `NEXT_PUBLIC_PRICE_BDT`, `NEXT_PUBLIC_BKASH_NUMBER`, `NEXT_PUBLIC_NAGAD_NUMBER`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_PORTFOLIO_URL`
3. Redeploy.

## Admin
- Sign up with the owner email → you become admin automatically.
- **Admin → Payments:** approve bKash/Nagad submissions (grants lifetime access).
- **Admin → Upload templates:** select a whole folder of `.json`/`.txt` workflows. Credentials are stripped, duplicates skipped, folder name = category.
- CLI bulk import: `SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-templates.mjs ./templates`

## Database
Schema: `supabase/schema.sql` + `supabase/extras.sql`. Workflow JSON is only returned via `get_template_workflow()` to users with access (150 copies / 24h limit).

## Local dev
```
npm install
cp .env.example .env.local   # fill in values
npm run dev
```
