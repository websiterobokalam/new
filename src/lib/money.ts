/**
 * Fees are stored GST-inclusive in paise. GST rate is a DEFAULT pending CA
 * confirmation for each course type (open question).
 */
export const GST_RATE = Number(process.env.GST_RATE_PERCENT ?? 18);

export function gstSplit(inclusivePaise: number) {
  const gst = Math.round((inclusivePaise * GST_RATE) / (100 + GST_RATE));
  return { total: inclusivePaise, gst, net: inclusivePaise - gst };
}

export function inr(paise: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);
}
