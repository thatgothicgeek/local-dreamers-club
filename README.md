# Local Dreamers Club

A lightweight, dependency-free website designed to be easy to change and deploy to Hostinger.

## The one file to edit first

Most words, links, colors, event details, and social handles live in:

`dist/assets/site-content.js`

Change that file before touching the page layouts. Each setting has a plain-English comment.

## Preview locally on a Mac

1. Double-click `preview.command`.
2. Keep the Terminal window open while reviewing the site.
3. Press Control-C in that window when finished.

Safari opens the preview automatically at `http://localhost:4321`.

If macOS refuses to open the launcher, right-click `preview.command`, choose **Open**, and confirm once.

## Terminal alternative

```bash
npm run dev
```

Then open `http://localhost:4321`.

## Pages

- `/` — Home
- `/oceans/` — Oceans Calling landing page
- `/about/` — The story and guiding principles
- `/connect/` — Discord, Etsy, and social links

## Publish to Hostinger

Upload everything inside `dist/` to the domain's `public_html/` directory. A GitHub-connected deployment can use `dist` as the publish directory.

Discord and Etsy are intentionally represented by safe placeholders until the real URLs are added to `site-content.js`.
