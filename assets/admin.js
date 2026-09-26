let csrf = "";
const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const message = (selector, text = "", error = false) => {
  const el = document.querySelector(selector);
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

function showSignedOut() {
  loginPanel.hidden = false;
  editorPanel.hidden = true;
}
function showSignedIn(username) {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
  document.querySelector("#admin-name").textContent = username;
  loadPosts();
  loadSiteSettings();
}

async function start() {
  try {
    const session = await api("/api/admin/session");
    csrf = session.token;
    session.username ? showSignedIn(session.username) : showSignedOut();
  } catch (error) {
    showSignedOut();
    message("#login-message", error.message, true);
  }
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  message("#login-message", "Signing in…");
  const form = new FormData(formElement);
  try {
    const result = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
    csrf = result.token;
    formElement.reset();
    showSignedIn(result.username);
  } catch (error) { message("#login-message", error.message, true); }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST" }); }
  finally { csrf = ""; showSignedOut(); }
});

const imageInput = document.querySelector("#post-images");
function renderImageAltInputs(files, target) {
  target.replaceChildren();
  if (files.length > 4) {
    message("#post-message", "Choose up to four photos per update.", true);
    return;
  }
  files.forEach((file, index) => {
    const row = document.createElement("label");
    row.className = "image-alt-row";
    const preview = document.createElement("img");
    preview.alt = "";
    preview.src = URL.createObjectURL(file);
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 240;
    input.placeholder = `Photo ${index + 1} description (optional)`;
    input.dataset.imageAlt = "";
    row.append(preview, input);
    target.append(row);
  });
}
imageInput.addEventListener("change", () => renderImageAltInputs([...imageInput.files], document.querySelector("#new-image-fields")));

document.querySelector("#post-body").addEventListener("input", (event) => {
  document.querySelector("#character-count").textContent = event.currentTarget.value.length;
});

function applyFormat(textarea, type) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const wrappers = { bold: ["**", "**"], italic: ["*", "*"], link: ["[", "](https://)"] };
  const [before, after] = wrappers[type] || ["", ""];
  const value = selected || (type === "link" ? "link text" : "text");
  textarea.setRangeText(`${before}${value}${after}`, start, end, "select");
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-format]");
  if (!button) return;
  const textarea = button.closest("form")?.querySelector('textarea[name="body"]');
  if (textarea) applyFormat(textarea, button.dataset.format);
});

function appendImageFields(formData, files, altInputs) {
  formData.append("imageAlts", JSON.stringify(altInputs.map((input) => input.value.trim())));
  files.forEach((file) => formData.append("images", file));
}

document.querySelector("#post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = form.elements.body.value;
  const files = [...imageInput.files];
  if (files.length > 4) return message("#post-message", "Choose up to four photos per update.", true);
  const data = new FormData();
  data.append("body", body);
  appendImageFields(data, files, [...document.querySelectorAll("#new-image-fields [data-image-alt]")]);
  message("#post-message", "Publishing…");
  try {
    await api("/api/admin/updates", { method: "POST", body: data });
    form.reset();
    document.querySelector("#character-count").textContent = "0";
    document.querySelector("#new-image-fields").replaceChildren();
    message("#post-message", "Your update is live.");
    loadPosts();
  } catch (error) { message("#post-message", error.message, true); }
});

async function loadPosts() {
  const container = document.querySelector("#admin-posts");
  container.innerHTML = '<p class="admin-muted">Loading updates…</p>';
  try {
    const data = await api("/api/admin/updates");
    container.replaceChildren();
    if (!data.items.length) container.innerHTML = '<p class="admin-muted">No updates yet. Your first post will appear here and on the club site.</p>';
    data.items.forEach((post) => container.append(renderPost(post)));
  } catch (error) { container.innerHTML = `<p class="admin-error">${esc(error.message)}</p>`; }
}

async function loadSiteSettings() {
  const form = document.querySelector("#site-settings-form");
  try {
    const settings = await api("/api/admin/site-settings");
    for (const name of ["aboutTitle", "aboutText", "dispatchesTitle", "dispatchesIntro"]) form.elements[name].value = settings[name];
    settings.socials.forEach((social, index) => {
      form.elements[`socialLabel${index}`].value = social.label;
      form.elements[`socialUrl${index}`].value = social.url;
      form.elements[`socialIcon${index}`].value = social.icon;
    });
  } catch (error) { message("#settings-message", error.message, true); }
}

document.querySelector("#site-settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const settings = Object.fromEntries(["aboutTitle", "aboutText", "dispatchesTitle", "dispatchesIntro"].map((key) => [key, form.elements[key].value]));
  settings.socials = [0, 1, 2].map((index) => ({
    label: form.elements[`socialLabel${index}`].value,
    url: form.elements[`socialUrl${index}`].value,
    icon: form.elements[`socialIcon${index}`].value
  }));
  message("#settings-message", "Saving page changes…");
  try {
    await api("/api/admin/site-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    message("#settings-message", "Page changes saved. Refresh the club site to see them.");
  } catch (error) { message("#settings-message", error.message, true); }
});

function renderPost(post) {
  const article = document.createElement("article");
  article.className = "admin-post";
  article.dataset.id = post.id;
  const photos = post.images.map((image) => `<img src="${esc(image.url)}" alt="${esc(image.alt || "Club update photo")}">`).join("");
  article.innerHTML = `<p class="admin-post-date">${esc(dateText(post.createdAt))}</p><p class="admin-post-body">${formatBody(post.body)}</p>${photos ? `<div class="admin-post-images">${photos}</div>` : ""}<div class="admin-post-actions"><button type="button" data-action="edit">Edit</button><button type="button" data-action="delete">Delete</button></div>`;
  article.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "delete") deletePost(post.id);
    if (button.dataset.action === "edit") editPost(post, article);
  });
  return article;
}

function editPost(post, article) {
  article.innerHTML = `<form class="admin-form edit-form"><p class="admin-post-date">${esc(dateText(post.createdAt))}</p><label>Update text<textarea name="body" maxlength="500" rows="4" required>${esc(post.body)}</textarea></label><div class="format-toolbar" role="toolbar" aria-label="Text formatting"><button type="button" data-format="bold" aria-label="Bold" title="Bold"><strong>B</strong></button><button type="button" data-format="italic" aria-label="Italic" title="Italic"><em>I</em></button><button type="button" data-format="link" aria-label="Insert link" title="Insert link">Link</button></div>${post.images.length ? `<fieldset class="remove-photos"><legend>Current photos</legend>${post.images.map((image) => `<label><input type="checkbox" name="removeImage" value="${image.id}"> Remove this photo <img src="${esc(image.url)}" alt="${esc(image.alt || "Club update photo")}"></label>`).join("")}</fieldset>` : ""}<label class="photo-picker">Add photos <span>Up to 4 total · JPEG, PNG, or WebP · 2 MB each</span><input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple></label><div class="image-fields"></div><div class="admin-post-actions"><button class="admin-primary" type="submit">Save update</button><button type="button" data-action="cancel">Cancel</button></div><p class="admin-message" role="status"></p></form>`;
  const form = article.querySelector("form");
  const fileInput = form.querySelector('input[type="file"]');
  const target = form.querySelector(".image-fields");
  fileInput.addEventListener("change", () => renderImageAltInputs([...fileInput.files], target));
  form.querySelector('[data-action="cancel"]').addEventListener("click", () => article.replaceWith(renderPost(post)));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = [...fileInput.files];
    const removeIds = [...form.querySelectorAll('input[name="removeImage"]:checked')].map((input) => Number(input.value));
    const kept = post.images.length - removeIds.length;
    if (files.length > 4 || kept + files.length > 4) return messageIn(form, "Each update can have up to four photos.", true);
    const data = new FormData();
    data.append("body", form.elements.body.value);
    data.append("removeImageIds", JSON.stringify(removeIds));
    appendImageFields(data, files, [...target.querySelectorAll("[data-image-alt]")]);
    messageIn(form, "Saving…");
    try {
      const result = await api(`/api/admin/updates/${post.id}`, { method: "PATCH", body: data });
      article.replaceWith(renderPost(result.item));
    } catch (error) { messageIn(form, error.message, true); }
  });
}

function formatBody(value) {
  return esc(value)
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}

function messageIn(form, text, error = false) {
  const el = form.querySelector(".admin-message");
  el.textContent = text;
  el.classList.toggle("is-error", error);
}

async function deletePost(id) {
  if (!window.confirm("Delete this update and its photos? This cannot be undone.")) return;
  try { await api(`/api/admin/updates/${id}`, { method: "DELETE" }); loadPosts(); }
  catch (error) { window.alert(error.message); }
}

start();
