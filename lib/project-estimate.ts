export type ServiceType = "design" | "development" | "both";
export type Timeline = "regular" | "fast" | "rush";

export type EstimateOptions = {
  serviceType: ServiceType;
  pages: number;
  needContent: boolean;
  needSEO: boolean;
  timeline: Timeline;
};

// Editable demonstration rates in BRL. They are not NexFlow's official rates
// or a claim about agency/freelancer market prices.
export const estimateRates = {
  design: { base: 900, perPage: 180 },
  development: { base: 1200, perPage: 250 },
  both: { base: 1800, perPage: 350 },
  content: 150,
  seo: 100,
  rush: 150,
  fast: 75,
};

export function calculateEstimate(options: EstimateOptions) {
  const {serviceType, needContent, needSEO, timeline} = options;
  const pages = Math.min(30, Math.max(1, Number.isFinite(options.pages) ? Math.round(options.pages) : 1));
  const rates = estimateRates[serviceType];
  const base = rates.base + (pages - 1) * rates.perPage;
  const content = needContent ? pages * estimateRates.content : 0;
  const seo = needSEO ? pages * estimateRates.seo : 0;
  const urgency = pages * (timeline === "rush" ? estimateRates.rush : timeline === "fast" ? estimateRates.fast : 0);
  const extras = content + seo + urgency;
  return {base, extras, content, seo, urgency, total: base + extras};
}

export const formatEstimate = (value: number) => value.toLocaleString("pt-BR", {style: "currency", currency: "BRL", maximumFractionDigits: 0});
