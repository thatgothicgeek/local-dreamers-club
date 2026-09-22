# Local Dreamers Club — easy-change guide

The site is intentionally split into three layers:

1. **Content and switches** — `dist/assets/site-content.js`
2. **Page structure** — `dist/assets/site.js`
3. **Visual styling** — `dist/assets/styles.css`

For normal changes, start with **site-content.js**.

## Turn a whole section on or off

At the very top of `site-content.js` is a `features` section:

```js
features: {
  oceansPage: true,
  homeMeetShareBelong: true,
  homeClubPulse: true,
  discord: true,
  etsy: true,
  instagram: true,
  communityPreview: true,
  shopPreview: true
}
```

Change `true` to `false` and that part disappears without deleting it.

Examples:

```js
shopPreview: false
```

hides the Etsy preview from the home page.

```js
oceansPage: false
```

removes Oceans from navigation and disables the event page.

This is the preferred way to test things Ashlie is unsure about.

## Change words

Edit the matching section in `site-content.js`:

- `brand` — main identity and homepage message
- `home` — Meet / Share / Belong
- `community` — homepage community preview
- `shop` — homepage Etsy preview
- `oceans` — festival landing page
- `about` — story and principles
- `connect` — Discord, Etsy and Instagram descriptions

## Add real links

Change:

```js
discord: "",
```

to:

```js
discord: "https://discord.gg/your-invite",
```

Empty links automatically appear as **coming soon**.

## Change the site colors

The five main colors live in:

```js
theme: {
  ink: "#0a0a0b",
  paper: "#f2eee5",
  red: "#b72f36",
  yellow: "#d4ad43",
  muted: "#a6a099"
}
```

One color change updates the whole site.

## Discord and Etsy integration

Both integrations begin in manual mode:

```js
integrations: {
  discord: {
    mode: "manual",
    publicFeedEnabled: false
  },
  etsy: {
    mode: "manual",
    liveProductsEnabled: false
  }
}
```

We will switch these on only after the Discord server and Etsy API connection are ready.

The public site should only show:
- Discord posts/threads that you explicitly choose to feature
- Etsy listings Ashlie chooses to expose

No private Discord conversation should ever be pulled automatically.

## Safe review routine

1. Change one thing in `site-content.js`.
2. Run `preview.command` or `npm run dev`.
3. Check Home and Oceans on desktop and a phone-sized window.
4. If Ashlie does not like it, undo the edit or switch that feature to `false`.
5. Commit only the version you both want to keep.

The goal is simple: changing your mind should be cheap.
