import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync, spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const htmlScript = path.join(scriptDir, "export-paper.mjs");
const htmlPath = path.join(root, "docs", "agentboundary-paper.html");
const pdfPath = path.join(root, "docs", "agentboundary-paper.pdf");
const publicPdfPath = path.join(root, "website", "public", "agentboundary-paper.pdf");
const renderer = process.env.PDF_RENDERER || "chrome";
if (renderer !== "chrome" && renderer !== "weasyprint") {
  throw new Error(`Unknown PDF_RENDERER: ${renderer}. Expected chrome or weasyprint.`);
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Could not find Chrome/Chromium. Set CHROME_PATH to the browser executable.");
}

execFileSync(process.execPath, [htmlScript], { cwd: path.join(root, "website"), stdio: "inherit" });

const executable = renderer === "weasyprint" ? (process.env.WEASYPRINT_PATH || "weasyprint") : chromePath();
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "agentboundary-paper-"));
const temporaryPdf = path.join(temporaryDirectory, "paper.pdf");
try {
  const result = spawnSync(
    executable,
    renderer === "weasyprint" ? [htmlPath, temporaryPdf] : [
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${temporaryPdf}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${renderer} PDF export failed with status ${result.status}`);

  const pdfBytes = fs.readFileSync(temporaryPdf);
  if (pdfBytes.length < 5 || pdfBytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(`${renderer} did not produce a valid PDF file.`);
  }
  const forbidden = [Buffer.from("/Users/"), Buffer.from("file:///"), Buffer.from("AgentBoundary/docs")];
  const hit = forbidden.find(needle => pdfBytes.includes(needle));
  if (hit) throw new Error(`PDF appears to contain a local path or file URL: ${hit.toString("utf8")}`);

  fs.mkdirSync(path.dirname(publicPdfPath), { recursive: true });
  fs.writeFileSync(pdfPath, pdfBytes);
  fs.writeFileSync(publicPdfPath, pdfBytes);
  console.log(`Wrote matching manuscript and website PDFs using ${renderer}`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
