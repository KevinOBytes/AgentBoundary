export const REPOSITORY = "https://github.com/KevinOBytes/AgentBoundary";
export const LEGACY_SUMMARY_URL = `${REPOSITORY}/blob/4ed11b07824e7ba195bed6d3b964ce648c6ceffb/results/benchmark_current_summary.json`;

export function sourceUrl(file: string): string {
  return `${REPOSITORY}/blob/main/${file.split("/").map(encodeURIComponent).join("/")}`;
}

export function percent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function interval(low: number, high: number): string {
  return `${percent(low)} to ${percent(high)}`;
}

export function paperLinkUrl(href?: string): string | undefined {
  if (!href || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
  return new URL(href, `${REPOSITORY}/blob/main/docs/`).href;
}
