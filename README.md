# Local Dreamers Club

A small Node.js site with a public landing page and a private editor for short club updates.

## Pages

- `/` — Landing page, club links, About, and Dreamer Dispatches
- `/admin/` — Private sign-in, publishing, and update management
- `/oceans/`, `/about/`, `/connect/` — Earlier supporting pages

## Local preview

Install Node.js 20 or newer, then run `npm install` once. Start the site with `npm run dev` and open `http://localhost:4321`.

Without database settings, the landing page and admin sign-in screen can be previewed, but publishing and loading updates will report that the update service is not configured. The database setup is in `database/schema.sql`.

## Hostinger setup

This app needs Hostinger Node.js Web App hosting on a Business or Cloud plan and a MariaDB database. Confirm the current plan supports Node.js before deploying. Set the database connection, session secret, and two admin accounts in Hostinger environment settings. Import `database/schema.sql` into that database.

Create each admin password hash locally in a terminal using `node scripts/hash-password.mjs 1` or `node scripts/hash-password.mjs 2`. Enter a different password for each person. Copy the printed hash into `ADMIN_1_PASSWORD_HASH` or `ADMIN_2_PASSWORD_HASH`; set matching `ADMIN_1_USERNAME` and `ADMIN_2_USERNAME`. Never commit passwords, hashes, database credentials, or session secrets.

Required environment settings:

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; optionally `DB_PORT` (defaults to `3306`)
- `SESSION_SECRET` — a random value of at least 32 characters
- `ADMIN_1_USERNAME`, `ADMIN_1_PASSWORD_HASH`
- `ADMIN_2_USERNAME`, `ADMIN_2_PASSWORD_HASH`
- `NODE_ENV=production`

Set the Hostinger start command to `npm start`. The process serves both the public site and its API. Do not deploy until the actual plan and MariaDB connection have been confirmed.

## Image and post handling

Updates publish immediately and appear newest first. Each has up to 500 plain-text characters and up to four optional JPEG, PNG, or WebP images, each no larger than 2 MB. Image data is stored in MariaDB so it remains available after app deployments. Images may include an optional description for screen readers.

For design text and social links, edit `dist/assets/site-content.js`. The interactive feed content is managed from `/admin/`.
