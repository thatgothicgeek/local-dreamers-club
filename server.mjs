import express from "express";
import cookieSession from "cookie-session";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import mysql from "mysql2/promise";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { join } from "node:path";

const scrypt = promisify(scryptCallback);
const app = express();
const port = Number(process.env.PORT || 4321);
const isProduction = process.env.NODE_ENV === "production";
const dist = join(process.cwd(), "dist");

const hasDbConfig = Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
if (isProduction && !hasDbConfig) throw new Error("Set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD before starting in production.");
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
}
if (isProduction && [1, 2].some((index) => !process.env[`ADMIN_${index}_USERNAME`] || !process.env[`ADMIN_${index}_PASSWORD_HASH`])) {
  throw new Error("Configure separate usernames and password hashes for both club admins.");
}

const pool = hasDbConfig ? mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 6,
  maxIdle: 4,
  idleTimeout: 60000,
  charset: "utf8mb4"
}) : null;

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);
app.use(express.json({ limit: "16kb" }));
app.use(cookieSession({
  name: "ldc_admin",
  keys: [process.env.SESSION_SECRET || "local-development-only-session-key-change-before-deploy"],
  maxAge: 8 * 60 * 60 * 1000,
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax"
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 4, fields: 4, fieldSize: 16 * 1024 }
});
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

function databaseRequired(_req, res, next) {
  if (!pool) return res.status(503).json({ error: "The update service is not configured yet." });
  next();
}

function randomToken() { return randomBytes(32).toString("base64url"); }
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = randomToken();
  return req.session.csrf;
}
function verifyCsrf(req, res, next) {
  if (!safeEqual(req.get("x-csrf-token"), req.session.csrf)) return res.status(403).json({ error: "Refresh the page and try again." });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Sign in to manage club updates." });
  next();
}

function validImage(file) {
  const b = file.buffer;
  const isPng = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const isWebp = b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
  const mime = isPng ? "image/png" : isJpeg ? "image/jpeg" : isWebp ? "image/webp" : "";
  return mime && mime === file.mimetype ? mime : null;
}
function cleanAlt(value) { return String(value || "").trim().slice(0, 240); }
function readImageAlts(value, count) {
  if (!value) return Array(count).fill("");
  try {
    const parsed = JSON.parse(value);
    return Array.from({ length: count }, (_, i) => cleanAlt(parsed[i]));
  } catch { return null; }
}
function publicPost(row) {
  return {
    id: Number(row.id),
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    images: row.images || []
  };
}
async function getPosts(rows) {
  if (!rows.length) return [];
  const ids = rows.map((row) => Number(row.id));
  const [images] = await pool.query(
    `SELECT id, post_id, alt_text FROM post_images WHERE post_id IN (${ids.map(() => "?").join(",")}) ORDER BY position ASC, id ASC`, ids
  );
  const byPost = new Map(ids.map((id) => [id, []]));
  for (const image of images) byPost.get(Number(image.post_id)).push({ id: Number(image.id), alt: image.alt_text, url: `/api/images/${image.id}` });
  return rows.map((row) => publicPost({ ...row, images: byPost.get(Number(row.id)) || [] }));
}
function validateBody(body) {
  if (typeof body !== "string" || !body.trim()) return "Write a short update before publishing.";
  if (body.length > 500) return "Updates can be up to 500 characters.";
  return "";
}
function validateFiles(files, alts) {
  if (alts === null) return "Image descriptions could not be read. Please try again.";
  const types = files.map(validImage);
  if (types.some((type) => !type)) return "Use JPEG, PNG, or WebP images only.";
  return "";
}
async function addImages(connection, postId, files, alts, positionStart = 0) {
  for (let i = 0; i < files.length; i += 1) {
    await connection.execute(
      "INSERT INTO post_images (post_id, mime_type, alt_text, position, image_data) VALUES (?, ?, ?, ?, ?)",
      [postId, validImage(files[i]), alts[i], positionStart + i, files[i].buffer]
    );
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true, databaseConfigured: Boolean(pool) }));
app.get("/api/admin/csrf", (req, res) => res.json({ token: csrfToken(req) }));
app.get("/api/admin/session", (req, res) => res.json({ username: req.session.admin || null, token: csrfToken(req) }));

app.post("/api/admin/login", loginLimiter, databaseRequired, verifyCsrf, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    let matched = false;
    for (const index of [1, 2]) {
      const configuredUser = process.env[`ADMIN_${index}_USERNAME`];
      const encoded = process.env[`ADMIN_${index}_PASSWORD_HASH`];
      if (!configuredUser || !encoded) continue;
      const [salt, expectedHex] = encoded.split(":");
      if (!salt || !expectedHex) continue;
      const actual = await scrypt(password, salt, 64);
      if (safeEqual(username.toLowerCase(), configuredUser.toLowerCase()) && safeEqual(actual.toString("hex"), expectedHex)) matched = true;
    }
    if (!matched) return res.status(401).json({ error: "That username and password did not match." });
    req.session = { admin: username, csrf: randomToken() };
    res.json({ username, token: req.session.csrf });
  } catch (error) { next(error); }
});

app.post("/api/admin/logout", databaseRequired, requireAdmin, verifyCsrf, (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get("/api/updates", databaseRequired, async (req, res, next) => {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 10));
    const before = req.query.before ? Number(req.query.before) : null;
    if (req.query.before && (!Number.isSafeInteger(before) || before < 1)) return res.status(400).json({ error: "Invalid update cursor." });
    const [rows] = before
      ? await pool.execute("SELECT id, body, created_at FROM posts WHERE id < ? ORDER BY id DESC LIMIT ?", [before, limit + 1])
      : await pool.execute("SELECT id, body, created_at FROM posts ORDER BY id DESC LIMIT ?", [limit + 1]);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    res.json({ items: await getPosts(page), nextCursor: hasMore ? String(page.at(-1).id) : null });
  } catch (error) { next(error); }
});

app.get("/api/images/:id", databaseRequired, async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT mime_type, image_data FROM post_images WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.sendStatus(404);
    res.set({ "Content-Type": rows[0].mime_type, "Content-Length": rows[0].image_data.length, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" });
    res.send(rows[0].image_data);
  } catch (error) { next(error); }
});

app.use("/api/admin", databaseRequired, requireAdmin, verifyCsrf);
app.get("/api/admin/updates", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT id, body, created_at FROM posts ORDER BY id DESC LIMIT 100");
    res.json({ items: await getPosts(rows) });
  } catch (error) { next(error); }
});
app.post("/api/admin/updates", upload.array("images", 4), async (req, res, next) => {
  const body = String(req.body.body || "");
  const files = req.files || [];
  const alts = readImageAlts(req.body.imageAlts, files.length);
  const errorMessage = validateBody(body) || validateFiles(files, alts);
  if (errorMessage) return res.status(400).json({ error: errorMessage });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO posts (body, created_by) VALUES (?, ?)", [body.trim(), req.session.admin]);
    await addImages(connection, result.insertId, files, alts);
    await connection.commit();
    const [rows] = await pool.execute("SELECT id, body, created_at FROM posts WHERE id = ?", [result.insertId]);
    res.status(201).json({ item: (await getPosts(rows))[0] });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
});
app.patch("/api/admin/updates/:id", upload.array("images", 4), async (req, res, next) => {
  const body = String(req.body.body || "");
  const files = req.files || [];
  const alts = readImageAlts(req.body.imageAlts, files.length);
  let removeIds;
  try { removeIds = JSON.parse(req.body.removeImageIds || "[]"); } catch { return res.status(400).json({ error: "Image selection could not be read." }); }
  if (!Array.isArray(removeIds) || removeIds.some((id) => !Number.isSafeInteger(Number(id)))) return res.status(400).json({ error: "Image selection could not be read." });
  const errorMessage = validateBody(body) || validateFiles(files, alts);
  if (errorMessage) return res.status(400).json({ error: errorMessage });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [postRows] = await connection.execute("SELECT id FROM posts WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!postRows.length) { await connection.rollback(); return res.sendStatus(404); }
    const [imageRows] = await connection.execute("SELECT id FROM post_images WHERE post_id = ?", [req.params.id]);
    const knownIds = new Set(imageRows.map((row) => Number(row.id)));
    if (removeIds.some((id) => !knownIds.has(Number(id)))) { await connection.rollback(); return res.status(400).json({ error: "One of the selected photos no longer belongs to this update." }); }
    if (imageRows.length - new Set(removeIds.map(Number)).size + files.length > 4) { await connection.rollback(); return res.status(400).json({ error: "Each update can have up to four photos. Remove one before adding another." }); }
    await connection.execute("UPDATE posts SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [body.trim(), req.params.id]);
    if (removeIds.length) await connection.query(`DELETE FROM post_images WHERE post_id = ? AND id IN (${removeIds.map(() => "?").join(",")})`, [req.params.id, ...removeIds]);
    const [remaining] = await connection.execute("SELECT COALESCE(MAX(position), -1) AS max_position FROM post_images WHERE post_id = ?", [req.params.id]);
    await addImages(connection, req.params.id, files, alts, Number(remaining[0].max_position) + 1);
    await connection.commit();
    const [rows] = await pool.execute("SELECT id, body, created_at FROM posts WHERE id = ?", [req.params.id]);
    res.json({ item: (await getPosts(rows))[0] });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
});
app.delete("/api/admin/updates/:id", async (req, res, next) => {
  try {
    const [result] = await pool.execute("DELETE FROM posts WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.sendStatus(404);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get(/^\/oceans(?:\/.*)?$/i, (_req, res) => res.redirect(302, "/"));
app.use(express.static(dist, { index: "index.html", maxAge: isProduction ? "1h" : 0 }));
app.get("/admin", (_req, res) => res.redirect(302, "/admin/"));
app.get("/admin/", (_req, res) => res.sendFile(join(dist, "admin", "index.html")));
app.get("/api/*path", (_req, res) => res.status(404).json({ error: "That API route was not found." }));
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Each photo must be 2 MB or smaller." : "Add up to four photos per update.";
    return res.status(400).json({ error: message });
  }
  console.error("Request failed:", error.message);
  res.status(500).json({ error: "That did not work. Please try again." });
});

app.listen(port, () => console.log(`Local Dreamers Club listening on port ${port}`));
