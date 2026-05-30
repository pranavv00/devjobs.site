# DevJobsHub

> High-performance automated job aggregation — scrapes top remote developer roles from five sources and serves them on a premium Next.js interface, refreshed every 12 hours.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=nextdotjs)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-automated-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Features

| | Feature | Description |
|---|---|---|
| 🔄 | **Massive Ingest** | Scrapes and deduplicates jobs from WeWorkRemotely, Remotive, RemoteOK, WorkingNomads, and JobRight |
| ⚡ | **Auto-Aggregator** | GitHub Actions workflow updates `jobs.json` every 12 hours — zero manual intervention |
| 🎨 | **Premium Frontend** | Responsive Next.js 14+ UI with Framer Motion animations and ISR 1-hour caching |
| 🔍 | **SEO Optimized** | Dynamic metadata, JSON-LD JobPosting schema, and automated sitemap generation |
| 💰 | **Monetization Ready** | Pre-configured Google AdSense placeholders — just add your publisher ID |

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   01 — PYTHON       │     │   02 — GITHUB REPO   │     │   03 — NEXT.JS      │
│                     │     │                     │     │                     │
│   Scraper           │────▶│   Data Storage      │────▶│   Frontend          │
│                     │     │                     │     │                     │
│  Fetches, cleans,   │     │  Flat-file database │     │  Fetches via Raw    │
│  deduplicates, and  │     │  — no external DB   │     │  URL, ISR 1h cache, │
│  writes jobs.json   │     │  required           │     │  served at the edge │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## Setup

### 1. Backend Scraper

```bash
# Install dependencies
pip install -r agent/requirements.txt

# Run the scraper
python -m agent.main
```

### 2. GitHub Actions Automation

1. Push this project to a GitHub repository.
2. In `agent/config.py`, update `GITHUB_RAW_JOBS_URL` with your repository path.
3. The scraper runs automatically at **00:00 and 12:00 UTC** daily — no further setup needed.

### 3. Frontend Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

> Update `src/lib/data.ts` with your GitHub Raw URL before running.

---

## Configuration

| File | Purpose |
|---|---|
| `agent/scraper.py` | Add or remove job board scraping sources |
| `src/app/layout.tsx` | Insert your Google AdSense publisher ID |
| `src/app/sitemap.ts` | Update the base URL for sitemap generation |

---

## Deployment

The project is pre-configured for both Vercel and Railway — connect your repository and the platform will handle the rest.

### Vercel

`vercel.json` and `.vercelignore` enforce the Next.js framework and prevent Python files from interfering with the build.

### Railway

`railway.json` explicitly sets the Node.js build and start commands for a clean deployment.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
