# DSP Tune Viewer

A Vercel-hosted web app that reads **Audiotec Fischer PC-Tool 6 (`.pct6`)** DSP
tunes — the format used by HELIX, BRAX and MATCH ACO-based car-audio DSPs — and
presents every channel's gain, delay, polarity, crossover and full parametric
EQ as a clean, visual, mobile-friendly report.

Upload a raw `.pct6` and it's decoded and stored as schema-conformant JSON
instantly; or upload pct6-tune JSON directly. Unconfigured channels are hidden.

## Features

- **Two input formats** — raw `.pct6` (decoded in-app) or
  [pct6-tune v1](https://github.com/sl463/pct6-tools) JSON (schema-validated).
- **Instant conversion & archival** — a `.pct6` is decoded on upload; both the
  original file and the derived JSON are stored.
- **Visualized** — modeled EQ + crossover frequency-response curves per channel
  and a combined system-response overview, plus per-band boost/cut strips.
- **Readable everywhere** — responsive layout designed for iPhone/iPad.
- **Hidden clutter** — only configured channels show; assigned-but-untuned ones
  are one toggle away, fully-unassigned ones are never shown.
- **Public library + admin** — a customer-friendly, searchable tune library
  with a management (upload/delete) area.

## Stack

- Next.js 16 (App Router) · TypeScript · Tailwind v4 (semantic design tokens)
- Vercel Blob for storage (local `.data/` fallback in dev)
- Decoder ported 1:1 from `pct6-tools`' `pct6_extract.py` (verified byte-for-byte
  against its reference JSON — see `src/lib/pct6/verify.mts`)

## Local development

```sh
npm install
npm run dev            # http://localhost:3000
```

Without a Blob token the app stores tunes under `.data/` so everything works
locally. Verify the decoder against the reference fixture:

```sh
npx tsx src/lib/pct6/verify.mts
```

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token. Omit for local `.data/` storage. |

## Deploy to Vercel

1. Import the repo in Vercel.
2. Add a **Blob** store (Storage tab) — it sets `BLOB_READ_WRITE_TOKEN` automatically.
3. Deploy.

## Auth (to be added)

`/upload` and `/admin` are currently **open** — auth is intentionally left out so
it can be wired later with Vercel Authentication (or another provider). The
public library, tune pages and JSON API stay public.

## Project layout

```
src/
  app/                     routes (public pages, admin, upload, API)
  components/              UI + visualization (ResponseChart, ChannelCard, …)
  lib/
    pct6/                  decoder, schema types, channel-name tables, validator
    dsp.ts                 frequency-response math (biquad EQ + crossovers)
    storage.ts             Vercel Blob / local .data store
    ingest.ts              upload → decode/validate → save pipeline
    tune.ts / view.ts      presentation helpers & server-side view-models
reference/                 canonical schema + FINDINGS.md (from pct6-tools)
```

## Credits

Decoding and the tune schema are based on
[pct6-tools](https://github.com/sl463/pct6-tools). Not affiliated with or
endorsed by Audiotec Fischer; product names are trademarks of their respective
owners.
