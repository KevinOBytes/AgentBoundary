import fs from "fs";
import path from "path";
import { execFileSync, spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const htmlScript = path.join(scriptDir, "export-paper.mjs");
const htmlPath = path.join(root, "docs", "agentboundary-paper.html");
const pdfPath = path.join(root, "docs", "agentboundary-paper.pdf");

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

const chrome = chromePath();
const result = spawnSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  throw new Error(`Chrome PDF export failed with status ${result.status}`);
}

const pdfBytes = fs.readFileSync(pdfPath);
const forbidden = [Buffer.from("/Users/"), Buffer.from("file:///"), Buffer.from("AgentBoundary/docs")];
const hit = forbidden.find((needle) => pdfBytes.includes(needle));
if (hit) {
  throw new Error(`PDF appears to contain a local path or file URL: ${hit.toString("utf8")}`);
}

console.log(`Wrote ${pdfPath} without Chrome header/footer metadata`);
