# The easy-change guide

You should not need to dig through the design code for normal updates.

Open `dist/assets/site-content.js`. It is divided into plain sections:

- `brand` — name, main message, description, and footer line
- `links` — Discord, Etsy, Instagram, and email destinations
- `home` — the Meet / Share / Belong wording
- `oceans` — festival headline, invitation, location, and date
- `about` — story and principles
- `connect` — short descriptions of each place to connect
- `theme` — the five site colors

## Add a real link

Change this:

```js
discord: "",
```

to this:

```js
discord: "https://discord.gg/your-invite",
```

An empty link automatically displays “coming soon,” so unfinished destinations are never broken.

## Change a color

Use any six-digit hex color inside `theme`. For example:

```js
red: "#b72f36",
```

That one change updates buttons, accents, line art, and highlighted words across every page.

## Safe review routine

1. Change one section in `site-content.js`.
2. Double-click `preview.command` and refresh the page after each edit.
3. Check Home and Oceans on a phone-sized window.
4. Keep the change if both of you like it; undo it if you do not.

The layouts live in `dist/assets/site.js`, while the visual styling lives in `dist/assets/styles.css`. Those files only need editing for structural or design changes.
