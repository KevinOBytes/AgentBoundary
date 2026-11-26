# Website

The current website reads `../results/reconciled_stats.json`. Generate and validate that artifact from retained records before building:

```bash
npm ci
npm run build
```

The earlier 45-model harness cohort is linked separately and is not combined with the current results.

## Paper export

`npm run export:paper:pdf` renders `../docs/whitepaper.md` and writes matching PDFs to `../docs/agentboundary-paper.pdf` and `public/agentboundary-paper.pdf`. Rebuild the website after changing the public PDF so the static export receives the same file.

Chrome or Chromium is the default renderer. Set `CHROME_PATH` if its executable is not in a standard location.

For environments where a browser process cannot run, an independently installed WeasyPrint executable can render the same HTML:

```bash
PDF_RENDERER=weasyprint WEASYPRINT_PATH=/path/to/weasyprint npm run export:paper:pdf
```

`WEASYPRINT_PATH` is optional when `weasyprint` is on `PATH`. Accepted `PDF_RENDERER` values are `chrome` and `weasyprint`; other values fail before export. Both paths validate a newly generated temporary PDF before updating the manuscript and website copies. Review the rendered PDF because pagination can differ between renderers.
