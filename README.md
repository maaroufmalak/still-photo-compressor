# Still — Photo & Video Compressor

A static, browser-local photo and video compressor. No photo or video uploads, backend processing, accounts for image storage, or analytics.

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


## Video compressor

Open [the video tool](https://maaroufmalak.github.io/still-photo-compressor/video.html), or choose Videos in the navigation.

- AVI, MOV, MP4, M4V, WebM and MKV inputs, subject to the contained codecs.
- MP4 output with H.264 / yuv420p video and optional 128 kbps stereo AAC audio.
- Best detail (CRF 18), Balanced (23), or Smaller file (28), using x264's veryfast preset.
- Original size or longest-edge ceilings of 1,920, 1,280 and 854 pixels. Aspect ratio is preserved, dimensions are even, and images are not upscaled.
- Keep original frame rate or choose 30 / 24 fps. Keep or remove sound.
- One video at a time, up to 200 MB. Local preview, measured size savings and MP4 download.
- First video and optional first audio track only; no subtitles, chapters or copied source metadata.
- Immediate cancellation, three-minute engine-load timeout and thirty-minute processing timeout. Every run uses a disposable worker, releasing its in-memory input/output and codec memory on completion, cancellation or failure.
- The single-thread ffmpeg.wasm engine is downloaded only when conversion starts (~32 MB before transport compression). It needs no cross-origin isolation headers, so it works on GitHub Pages. No user media is uploaded.

Video compression is lossy and output size is not guaranteed to decrease. HDR / Dolby Vision color is not tone-mapped; export SDR first for predictable color. Codec support and available memory vary. Phones can run out of memory below the 200 MB input limit. Short clips on current desktop browsers work best.

Video verification used real generated moving-image clips with audio: AVI (MPEG-4 + PCM) to MP4 (H.264 + AAC), and MOV to a resized 24 fps silent MP4. Exported codecs, dimensions, frame rates and audio presence were probed from the downloaded files. Browser cancellation, retry, invalid files, navigation and responsive layout were checked. Run `npm test` for video regression checks.

Video dependencies: `@ffmpeg/ffmpeg` 0.12.15 and `@ffmpeg/core` 0.12.10, shipped unmodified from npm. Licensing and corresponding source/build links are in `dist/vendor/ffmpeg/SOURCES.txt` and `dist/vendor/NOTICES.txt`.
