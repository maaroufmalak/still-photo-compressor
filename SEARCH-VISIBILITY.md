# Search visibility for Still

Public URL: https://maaroufmalak.github.io/still-photo-compressor/

Sitemap: https://maaroufmalak.github.io/still-photo-compressor/sitemap.xml

## Implemented

- A descriptive page title, H1 and search description for free image and RAW image compression.
- Static, visible explanations and FAQs covering iPhone RAW / DNG, HEIC conversion, compression to 2 MB or 3 MB, quality tradeoffs, and privacy.
- A canonical URL, indexable robots meta tag, sitemap and descriptive social previews.
- Truthful WebApplication structured data identifying the zero-price offer and creator. No invented ratings, reviews or ranking claims.
- A small decorative thumbnail so the full sample photo is only requested when a visitor tries it.
- Builder credit: Maarouf Malak and GPT-6.1 Sol.

## Owner step: request indexing

1. Open https://search.google.com/search-console/ and add a URL-prefix property for the public URL above. A domain property requires DNS ownership of github.io, which a GitHub Pages project does not provide.
2. Choose HTML tag verification. Copy the exact google-site-verification meta tag into the page head in dist/index.html, push the change, wait for deployment, then verify in Search Console. Never remove the tag after verification.
3. Submit the sitemap URL above in Sitemaps, then use URL Inspection to request indexing of the homepage.
4. Use Search Console to measure indexing, queries, impressions and clicks over time. Share the actual tool with relevant photography and web communities when appropriate; do not buy links or create keyword-stuffed doorway pages.

No robots.txt is placed in this project's subdirectory: crawlers only use robots.txt at the host root, https://maaroufmalak.github.io/robots.txt. Publishing a robots.txt under /still-photo-compressor/ would not control crawling. If an account-level site later manages the host root, its robots.txt can reference this sitemap.

SEO does not guarantee indexing or a first-page position. Search engines control crawling and ranking; useful content, reputation and genuine links take time to develop.

References:
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/appearance/structured-data/software-app
- https://developers.google.com/crawling/docs/robots-txt/create-robots-txt
