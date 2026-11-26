import type { ModelResult } from "../types/results";

export const REPOSITORY = "https://github.com/KevinOBytes/AgentBoundary";
export const LEGACY_SUMMARY_URL = `${REPOSITORY}/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json`;

export function sourceUrl(file: string): string {
  return `${REPOSITORY}/blob/main/${file.split("/").map(encodeURIComponent).join("/")}`;
}

export function percent(rate: number | null): string {
  return rate === null ? "Not measured" : `${(rate * 100).toFixed(1)}%`;
}

export function rate(count: number, total: number): number | null {
  return total === 0 ? null : count / total;
}

export function interval(low: number | null, high: number | null): string {
  return low === null || high === null ? "Not measured" : `${percent(low)} to ${percent(high)}`;
}

export function modelChartRows(models: ModelResult[]) {
  // An absent endpoint is not a measured zero-percent outcome. Keep it in
  // coverage tables, but omit it from the chart of observed proportions.
  return models.filter(model => model.n > 0).map(model => ({
    name: model.model.split("/").pop() || model.model,
    Compliance: ((model.complied - model.overlap) / model.n) * 100,
    Refusal: ((model.refused - model.overlap) / model.n) * 100,
    Neither: (model.neutral / model.n) * 100,
    Both: (model.overlap / model.n) * 100,
  }));
}

export function paperLinkUrl(href?: string): string | undefined {
  if (!href || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
  return new URL(href, `${REPOSITORY}/blob/main/docs/`).href;
}
