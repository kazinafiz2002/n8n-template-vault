export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "n8n Template Vault",
  price: Number(process.env.NEXT_PUBLIC_PRICE_BDT || 999),
  bkash: process.env.NEXT_PUBLIC_BKASH_NUMBER || "01XXXXXXXXX",
  nagad: process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01XXXXXXXXX",
  portfolio: process.env.NEXT_PUBLIC_PORTFOLIO_URL || "",
};
