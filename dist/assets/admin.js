let csrf = "";
const page = document.body.dataset.adminPage || "editor";
const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const message = (selector, text = "", error = false) => {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-error", error);
};
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const dateText = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (csrf) headers.set("x-csrf-token", csrf);
  const response = await fetch(url, { ...options, headers });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
function showSignedOut() { loginPanel.hidden = false; editorPanel.hidden = true; }
function showSignedIn(username) {
  loginPanel.hidden = true; editorPanel.hidden = false;
  const name = document.querySelector("#admin-name");
  if (name) name.textContent = username;
  if (page === "updates") loadPosts();
  if (page === "settings") loadSiteSettings();
}
async function start() {
  try { const session = await api("/api/admin/session"); csrf = session.token; session.username ? showSignedIn(session.username) : showSignedOut(); }
  catch (error) { showSignedOut(); message("#login-message", error.message, true); }
}
document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
  event.preventDefault(); const formElement = event.currentTarget; message("#login-message", "Signing in…"); const form = new FormData(formElement);
  try { const result = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); csrf = result.token; formElement.reset(); showSignedIn(result.username); }
  catch (error) { message("#login-message", error.message, true); }
});
document.querySelector("#logout-button")?.addEventListener("click", async () => { try { await api("/api/admin/logout", { method: "POST" }); } finally { csrf = ""; showSignedOut(); } });

function toolbarMarkup() {
  return `<div class="format-toolbar" role="toolbar" aria-label="Text formatting"><button type="button" data-format="bold" aria-label="Bold" title="Bold"><strong>B</strong></button><button type="button" data-format="italic" aria-label="Italic" title="Italic"><em>I</em></button><button type="button" data-format="underline" aria-label="Underline" title="Underline"><u>U</u></button><button type="button" data-format="strike" aria-label="Strikethrough" title="Strikethrough"><s>S</s></button><button type="button" data-format="link" aria-label="Insert link" title="Insert link">Link</button><button type="button" data-emoji-toggle aria-expanded="false" aria-label="Choose emoji" title="Choose emoji">☺</button><div class="emoji-picker" hidden>${["🖤","🧡","❤️","💛","💙","🎶","🎤","🎸","🥁","🌊","⚡","⭐","✨","🫶","😭"].map((emoji) => `<button type="button" data-emoji="${emoji}" aria-label="${emoji}">${emoji}</button>`).join("")}</div></div>`;
}
function applyFormat(textarea, type) {
  const start = textarea.selectionStart, end = textarea.selectionEnd, selected = textarea.value.slice(start, end);
  const wrappers = { bold: ["**", "**"], italic: ["*", "*"], underline: ["++", "++"], strike: ["~~", "~~"], link: ["[", "](https://)"] };
  const [before, after] = wrappers[type] || ["", ""];
  const value = selected || (type === "link" ? "link text" : "text");
  textarea.setRangeText(`${before}${value}${after}`, start, end, "select"); textarea.focus(); textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
function insertEmoji(textarea, emoji) {
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  textarea.setRangeText(emoji, start, end, "end"); textarea.focus(); textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
document.addEventListener("click", (event) => {
  const format = event.target.closest("[data-format]");
  if (format) { const textarea = format.closest("form")?.querySelector('textarea[name="body"]'); if (textarea) applyFormat(textarea, format.dataset.format); return; }
  const toggle = event.target.closest("[data-emoji-toggle]");
  if (toggle) { const picker = toggle.parentElement.querySelector(".emoji-picker"); picker.hidden = !picker.hidden; toggle.setAttribute("aria-expanded", String(!picker.hidden)); return; }
  const emoji = event.target.closest("[data-emoji]");
  if (emoji) { const form = emoji.closest("form"); const textarea = form?.querySelector('textarea[name="body"]'); if (textarea) insertEmoji(textarea, emoji.dataset.emoji); emoji.closest(".emoji-picker").hidden = true; form?.querySelector("[data-emoji-toggle]")?.setAttribute("aria-expanded", "false"); }
});
function renderImageAltInputs(files, target, messageSelector = "#post-message") {
  target.replaceChildren();
  if (files.length > 4) { message(messageSelector, "Choose up to four photos per update.", true); return; }
  files.forEach((file, index) => { const row = document.createElement("label"); row.className = "image-alt-row"; const preview = document.createElement("img"); preview.alt = ""; preview.src = URL.createObjectURL(file); const input = document.createElement("input"); input.type = "text"; input.maxLength = 240; input.placeholder = `Photo ${index + 1} description (optional)`; input.dataset.imageAlt = ""; row.append(preview, input); target.append(row); });
}
const imageInput = document.querySelector("#post-images");
imageInput?.addEventListener("change", () => renderImageAltInputs([...imageInput.files], document.querySelector("#new-image-fields")));
document.querySelector("#post-body")?.addEventListener("input", (event) => { document.querySelector("#character-count").textContent = event.currentTarget.value.length; });
function appendImageFields(formData, files, altInputs) { formData.append("imageAlts", JSON.stringify(altInputs.map((input) => input.value.trim()))); files.forEach((file) => formData.append("images", file)); }
document.querySelector("#post-form")?.addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget, files = [...imageInput.files];
  if (files.length > 4) return message("#post-message", "Choose up to four photos per update.", true);
  const data = new FormData(); data.append("body", form.elements.body.value); appendImageFields(data, files, [...document.querySelectorAll("#new-image-fields [data-image-alt]")]); message("#post-message", "Publishing…");
  try { await api("/api/admin/updates", { method: "POST", body: data }); form.reset(); document.querySelector("#character-count").textContent = "0"; document.querySelector("#new-image-fields").replaceChildren(); message("#post-message", "Your update is live."); }
  catch (error) { message("#post-message", error.message, true); }
});
async function loadPosts() {
  const container = document.querySelector("#admin-posts"); if (!container) return;
  container.innerHTML = '<p class="admin-muted">Loading updates…</p>';
  try { const data = await api("/api/admin/updates"); container.replaceChildren(); if (!data.items.length) container.innerHTML = '<p class="admin-muted">No updates yet. Your first post will appear here and on the club site.</p>'; data.items.forEach((post) => container.append(renderPost(post))); }
  catch (error) { container.innerHTML = `<p class="admin-error">${esc(error.message)}</p>`; }
}
const socialIcons = `<option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="etsy">Etsy wordmark</option><option value="discord">Discord</option>`;
function addSocialRow(social = { label: "", url: "", icon: "instagram" }) {
  const list = document.querySelector("#social-settings-list"), row = document.createElement("div");
  row.className = "social-settings-row";
  row.innerHTML = `<label>Link name<input data-social-label maxlength="40" required value="${esc(social.label)}"/></label><label>HTTPS URL<input data-social-url type="url" required value="${esc(social.url)}"/></label><label>Icon<select data-social-icon>${socialIcons}</select></label><button class="admin-quiet remove-social" type="button" aria-label="Remove social link">Remove</button>`;
  row.querySelector("[data-social-icon]").value = social.icon;
  row.querySelector(".remove-social").addEventListener("click", () => { if (list.children.length <= 1) return message("#settings-message", "Keep at least one social link.", true); row.remove(); });
  list.append(row);
}
document.querySelector("#add-social")?.addEventListener("click", () => { const list = document.querySelector("#social-settings-list"); if (list.children.length >= 10) return message("#settings-message", "You can add up to ten social links.", true); addSocialRow(); });
async function loadSiteSettings() {
  const form = document.querySelector("#site-settings-form"); if (!form) return;
  try { const settings = await api("/api/admin/site-settings"); for (const name of ["aboutTitle", "aboutText", "dispatchesTitle", "dispatchesIntro"]) form.elements[name].value = settings[name]; const list = document.querySelector("#social-settings-list"); list.replaceChildren(); settings.socials.forEach(addSocialRow); }
  catch (error) { message("#settings-message", error.message, true); }
}
document.querySelector("#site-settings-form")?.addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget;
  const settings = Object.fromEntries(["aboutTitle", "aboutText", "dispatchesTitle", "dispatchesIntro"].map((key) => [key, form.elements[key].value]));
  settings.socials = [...document.querySelectorAll("#social-settings-list .social-settings-row")].map((row) => ({ label: row.querySelector("[data-social-label]").value, url: row.querySelector("[data-social-url]").value, icon: row.querySelector("[data-social-icon]").value }));
  message("#settings-message", "Saving page changes…");
  try { await api("/api/admin/site-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); message("#settings-message", "Page changes saved. Refresh the club site to see them."); }
  catch (error) { message("#settings-message", error.message, true); }
});
function renderPost(post) {
  const article = document.createElement("article"); article.className = "admin-post"; article.dataset.id = post.id;
  const photos = post.images.map((image) => `<img src="${esc(image.url)}" alt="${esc(image.alt || "Club update photo")}">`).join("");
  article.innerHTML = `<p class="admin-post-date">${esc(dateText(post.createdAt))}</p><p class="admin-post-body">${formatBody(post.body)}</p>${photos ? `<div class="admin-post-images">${photos}</div>` : ""}<div class="admin-post-actions"><button type="button" data-action="edit">Edit</button><button type="button" data-action="delete">Delete</button></div>`;
  article.addEventListener("click", (event) => { const button = event.target.closest("[data-action]"); if (!button) return; if (button.dataset.action === "delete") deletePost(post.id); if (button.dataset.action === "edit") editPost(post, article); }); return article;
}
function editPost(post, article) {
  article.innerHTML = `<form class="admin-form edit-form"><p class="admin-post-date">${esc(dateText(post.createdAt))}</p><label>Update text<textarea name="body" maxlength="500" rows="4" required>${esc(post.body)}</textarea></label>${toolbarMarkup()}${post.images.length ? `<fieldset class="remove-photos"><legend>Current photos</legend>${post.images.map((image) => `<label><input type="checkbox" name="removeImage" value="${image.id}"> Remove this photo <img src="${esc(image.url)}" alt="${esc(image.alt || "Club update photo")}"></label>`).join("")}</fieldset>` : ""}<label class="photo-picker">Add photos <span>Up to 4 total · JPEG, PNG, or WebP · 2 MB each</span><input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple></label><div class="image-fields"></div><div class="admin-post-actions"><button class="admin-primary" type="submit">Save update</button><button type="button" data-action="cancel">Cancel</button></div><p class="admin-message" role="status"></p></form>`;
  const form = article.querySelector("form"), fileInput = form.querySelector('input[type="file"]'), target = form.querySelector(".image-fields"); fileInput.addEventListener("change", () => renderImageAltInputs([...fileInput.files], target));
  form.querySelector('[data-action="cancel"]').addEventListener("click", () => article.replaceWith(renderPost(post)));
  form.addEventListener("submit", async (event) => { event.preventDefault(); const files = [...fileInput.files], removeIds = [...form.querySelectorAll('input[name="removeImage"]:checked')].map((input) => Number(input.value)); if (files.length > 4 || post.images.length - removeIds.length + files.length > 4) return messageIn(form, "Each update can have up to four photos.", true); const data = new FormData(); data.append("body", form.elements.body.value); data.append("removeImageIds", JSON.stringify(removeIds)); appendImageFields(data, files, [...target.querySelectorAll("[data-image-alt]")]); messageIn(form, "Saving…"); try { const result = await api(`/api/admin/updates/${post.id}`, { method: "PATCH", body: data }); article.replaceWith(renderPost(result.item)); } catch (error) { messageIn(form, error.message, true); } });
}
function formatBody(value) {
  return esc(value).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>").replace(/\+\+(.+?)\+\+/gs, "<u>$1</u>").replace(/~~(.+?)~~/gs, "<s>$1</s>").replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>").replace(/\n/g, "<br>");
}
function messageIn(form, text, error = false) { const el = form.querySelector(".admin-message"); el.textContent = text; el.classList.toggle("is-error", error); }
async function deletePost(id) { if (!window.confirm("Delete this update and its photos? This cannot be undone.")) return; try { await api(`/api/admin/updates/${id}`, { method: "DELETE" }); loadPosts(); } catch (error) { window.alert(error.message); } }
start();
