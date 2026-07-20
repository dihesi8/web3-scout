# Web3 Scout

Zero-cost agent that scouts early-stage web3 projects, filters out noise for
free, and only spends AI tokens reviewing the handful of leads worth your
time — then sends you a ready-to-send pitch on Telegram.

## How it works

```
DexScreener + Farcaster  →  heuristic filter (free)  →  NVIDIA AI review + pitch  →  Telegram
   (every run)               (cuts 95%+ of noise)          (only survivors)            (you)
```

Runs **twice a day** (9 AM and 6 PM UTC by default) rather than hourly —
keeps you comfortably inside free API rate limits.

Sources deliberately NOT automated, and why:
- **X/Twitter** — the API tier needed for keyword search costs $100+/month. Scraping it violates ToS and gets accounts banned. Check manually.
- **LinkedIn** — explicitly against their ToS to scrape, aggressive bot detection. Check manually once a lead looks promising.
- **CoinMarketCap/CryptoRank** — thin free tiers, not worth burning on constant polling. Skipped for now; can add later if needed.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Get your free API keys** (all zero-cost):

   | Key | Where to get it | Notes |
   |---|---|---|
   | `NVIDIA_API_KEY` | https://build.nvidia.com — pick any model, click "Get API Key" | Free tier |
   | `NVIDIA_MODEL` | (optional) any model slug from build.nvidia.com | Defaults to `meta/llama-3.1-70b-instruct` |
   | `TELEGRAM_BOT_TOKEN` | Message `@BotFather` on Telegram → `/newbot` | Instant, free |
   | `TELEGRAM_CHAT_ID` | Message your new bot once, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy the `chat.id` | — |
   | `NEYNAR_API_KEY` | https://neynar.com | Optional — Farcaster source is skipped if omitted |

3. **Copy `.env.example` to `.env`** and fill in the keys above.

4. **Run it locally once to test:**
   ```bash
   npm run dev
   ```
   You should get a Telegram message for any qualifying lead within a minute or two.

## Running it for free, automatically, without a server

This repo includes `.github/workflows/scan.yml`, which uses **GitHub
Actions** to run the scan every hour — completely free on a public repo,
no server or laptop needed:

1. Push this project to a GitHub repo.
2. Go to **Settings → Secrets and variables → Actions** and add each key
   from your `.env` as a repository secret (same names: `NVIDIA_API_KEY`,
   `NVIDIA_MODEL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEYNAR_API_KEY`).
3. Go to the **Actions** tab and manually trigger "Web3 Scout Scan" once to
   confirm it works. After that it runs hourly on its own.

## Tuning

Edit these in `.env`:
- `MIN_LIQUIDITY_USD` — raise this to see fewer, more established leads.
- `CHAINS` — comma-separated, e.g. `solana,base,ethereum`.

Edit `HIRING_KEYWORDS` in `src/sources/farcaster.ts` to change what phrases
trigger a Farcaster lead.

Edit the `riskScore >= 8` cutoff in `src/index.ts` if you want to see
riskier/earlier-stage projects too.

## Project structure

```
src/
  config.ts           # loads & validates env vars
  types.ts             # shared Lead type
  store.ts             # JSON-file dedupe so you don't get repeat alerts
  filter.ts             # free heuristic filter (runs before any AI call)
  sources/
    dexscreener.ts       # free, no API key
    farcaster.ts          # via Neynar free tier
  ai/
    gemini.ts              # review + pitch generation
  telegram.ts               # delivery
  index.ts                   # orchestrates the whole pipeline
```
