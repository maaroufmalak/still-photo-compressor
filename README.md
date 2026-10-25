# Still — Photo Compressor

A static, browser-local photo compressor. No photo uploads, backend processing, accounts for image storage, or analytics.

**Use it here: https://maaroufmalak.github.io/still-photo-compressor/**

The public website is free to use and does not require a login. Photo contents stay on the visitor's device.

Built by **Maarouf Malak and GPT-6.1 Sol**. Completely free, for everyone.

Search metadata, a sitemap and visible FAQs are included. See [SEARCH-VISIBILITY.md](SEARCH-VISIBILITY.md) for the owner's Google Search Console verification and indexing steps. Search rankings are not guaranteed.

## Publishing

Push changes to `main`. The GitHub Pages workflow checks the application JavaScript and publishes `dist/`. All asset and worker URLs are relative, so the application works under the GitHub Pages repository path.

## Run locally

Use Node.js 20 or newer and run `npm run dev`, then open http://127.0.0.1:4173. No dependency installation or build is required. Serve `dist/` over HTTP or HTTPS; opening `index.html` directly from disk will not support workers.

## Features

- DNG / RAW development through RawConvert / LibRaw 0.22.1.
- HEIC / HEIF decoding through heic-to 1.6.6 when native decoding is unavailable.
- JPEG, PNG, WebP and browser-supported AVIF inputs.
- WebP and JPEG output, 2 MB / 3 MB / custom 0.1–20 MB ceilings.
- Search for the highest encoder quality up to 98%, with an 82% floor. Reduce dimensions when needed, unless Original dimensions is selected. Small web inputs are targeted below their starting size as well.
- Maximum edge 3,840 (default), 2,560, 1,920 or original. Never upscale.
- Up to 30 photos at 200 MB each, processed sequentially in disposable workers.
- Fit-to-screen comparison of the decoded source and compressed export.
- Individual downloads and local ZIP creation with CRC32 and UTF-8 filenames.
- Export strips source metadata and uses standard dynamic range web output. Keep originals for editing and archiving.

## Compatibility

Use a current Chrome, Edge, Firefox or Safari with OffscreenCanvas and createImageBitmap. Camera RAW and HEIC support varies by codec. iPhone 12 Pro ProRAW and a Sony ARW sample were verified. Newer JPEG XL-compressed ProRAW may be unsupported; the UI reports errors and recommends a JPEG export rather than replacing the image with a thumbnail. No claim of lossless RAW retention is made.

Browser memory varies by device; large RAWs work best on desktop. Processing has a four-minute per-file timeout. Stop-after-current preserves completed results. Settings changes clear exports for recompression. Originals are never modified.

## Verification

Browser UI checks covered real 31.79 MB Sony ARW → 1,999,570-byte WebP, 29.20 MB iPhone 12 Pro DNG → under 2 MB WebP, HEIC conversion, comparison modal, custom target JPEG conversion, and ZIP download. ZIP integrity and image signatures were checked independently. `npm run check` validates application JavaScript syntax.

Third-party licensing and source links: `dist/vendor/NOTICES.txt`.
