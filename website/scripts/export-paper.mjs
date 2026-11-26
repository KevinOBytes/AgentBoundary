import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const source = path.join(root, "docs", "whitepaper.md");
const output = path.join(root, "docs", "agentboundary-paper.html");

const markdown = fs.readFileSync(source, "utf8");
const body = renderToStaticMarkup(
  React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm],
    skipHtml: true,
    components: {
      a: ({ node, href, ...props }) => {
        const target = href && !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)
          ? `https://github.com/KevinOBytes/AgentBoundary/blob/main/${path.posix.normalize(path.posix.join("docs", href))}`
          : href;
        return React.createElement("a", { ...props, href: target });
      },
    },
  }, markdown),
);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgentBoundary Paper</title>
  <style>
    @page {
      margin: 0.75in;
      @bottom-center {
        content: counter(page);
        font-family: sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background: #ffffff;
    }
    body {
      margin: 0 auto;
      max-width: 8in;
      padding: 0.4in 0.2in 0.6in;
      line-height: 1.55;
      font-size: 10.5pt;
    }
    h1, h2, h3 {
      color: #0f172a;
      line-height: 1.2;
      break-after: avoid;
    }
    h1 {
      font-size: 22pt;
      margin: 0 0 0.15in;
    }
    h2 {
      font-size: 15pt;
      margin-top: 0.28in;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.04in;
    }
    h3 {
      font-size: 12pt;
      margin-top: 0.2in;
    }
    h3 + p { break-after: avoid; }
    p, li {
      orphans: 3;
      widows: 3;
    }
    a {
      color: #0f766e;
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.12in 0 0.2in;
      break-inside: avoid;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.06in 0.08in;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 0.02in 0.04in;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.1in;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      break-inside: avoid;
      font-size: 8.8pt;
    }
    pre code {
      border: 0;
      padding: 0;
      background: transparent;
    }
    blockquote {
      border-left: 3px solid #0f766e;
      margin-left: 0;
      padding-left: 0.15in;
      color: #334155;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>
`;

fs.writeFileSync(output, html);
console.log(`Wrote ${output}`);
