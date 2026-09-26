const content = window.LDC_CONTENT;

const linkFor = (key) => content.links[key] || "";

function safeLink(url, label, className = "text-link") {
  if (!url) {
    return `<span class="${className} is-disabled" aria-label="${label}, coming soon">${label}<small>coming soon</small></span>`;
  }
  return `<a class="${className}" href="${url}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
}

function header() {
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="${content.brand.name} home">
        <span>LOCAL</span><span>DREAMERS</span><span>CLUB</span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/about/">About</a>
        <a href="/connect/">Connect</a>
      </nav>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} Local Dreamers Club. All rights reserved.</p>
      <p class="fine-print">Independent fan community; not affiliated with twenty one pilots, their music, or the rights holders.</p>
    </footer>`;
}

const socialIcons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.1"/><circle class="icon-dot" cx="17.7" cy="6.4" r="1.15"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 2h-3.3v13.2a3.2 3.2 0 1 1-2.8-3.2V8.6a6.6 6.6 0 1 0 6.1 6.6V8.2a8 8 0 0 0 4.5 1.3V6.2A4.7 4.7 0 0 1 16.5 2Z"/></svg>',
  etsy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v4h-1.5V5H9v6h6V9.5h1.5v5H15V13H9v6h8.5v-2H19v4H5v-1.5h1.5v-15H5Z"/></svg>',
  discord: '<svg class="discord-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 5.2a18 18 0 0 0-4.3-1.3l-.5 1a16 16 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.3 1.3C1.8 9 1 13.3 1.4 17.5a18 18 0 0 0 5.4 2.7l1.1-1.8c-.6-.2-1.2-.5-1.7-.8 3.6 1.7 8 1.7 11.6 0-.5.3-1.1.6-1.7.8l1.1 1.8a18 18 0 0 0 5.4-2.7c.4-4.2-.4-8.5-3-12.3Z"/><circle cx="8.5" cy="13.3" r="1.15"/><circle cx="15.5" cy="13.3" r="1.15"/></svg>'
};

function homePage() {
  const socials = content.socials?.length ? content.socials : [
    { label: "Instagram", url: content.links.instagram, icon: "instagram" },
    { label: "TikTok", url: content.links.tiktok, icon: "tiktok" },
    { label: "Etsy", url: content.links.etsy, icon: "etsy" }
  ];
  return `
    <main id="main" class="landing-main">
      <nav class="landing-social-bar" aria-label="Follow and support Local Dreamers Club">
        <div class="social-group">
          <span class="social-group-label">Follow us:</span>
          ${socials.slice(0, 2).map((social) => socialLinkFor(social)).join("")}
        </div>
        <div class="social-group">
          <span class="social-group-label">Rep the club:</span>
          ${socials.slice(2).map((social) => socialLinkFor(social)).join("")}
        </div>
      </nav>
      <section class="landing-content" aria-label="Welcome to Local Dreamers Club">
        <img class="landing-logo" src="/assets/images/local-dreamers-club-logo.png" alt="" width="2048" height="2048" />
        <div class="landing-copy">
          <h1 class="landing-tagline">${content.home.tagline}</h1>
          <p class="landing-invitation">${content.home.invitation}</p>
        </div>
      </section>
      <section class="action-panel" aria-label="Join the club on Discord">
        <a class="discord-button" href="${linkFor("discord")}" target="_blank" rel="noopener noreferrer">${socialIcons.discord}<span>Join the Club</span></a>
      </section>
      <section class="home-about" id="about">
        <p class="section-kicker">A place to find your people</p>
        <h2>${escapeHTML(content.home.aboutTitle)}</h2>
        <p>${escapeHTML(content.home.aboutText)}</p>
      </section>
      <section class="dispatches" id="dispatches" aria-labelledby="dispatches-title">
        <div class="dispatches-heading">
          <div><p class="section-kicker">From the club</p><h2 id="dispatches-title">${escapeHTML(content.home.dispatchesTitle)}</h2></div>
          <p>${escapeHTML(content.home.dispatchesIntro)}</p>
        </div>
        <div id="dispatch-list" class="dispatch-list" aria-live="polite"><p class="feed-message">Loading dispatches…</p></div>
        <button id="load-more" class="load-more" type="button" hidden>Load older updates</button>
      </section>
      <footer class="landing-footer">
        <span>© ${new Date().getFullYear()} Local Dreamers Club. All rights reserved. Independent fan community; not affiliated with twenty one pilots, their music, or rights holders.</span>
      </footer>
    </main>`;
}

function socialLinkFor(social) {
  const url = social.url || "";
  const icon = social.icon || "instagram";
  const label = social.label || "Social link";
  const accessibleLabel = `Visit Local Dreamers Club on ${label}`;
  const glyph = icon === "etsy" ? '<span class="etsy-wordmark" aria-hidden="true">Etsy</span>' : socialIcons[icon] || socialIcons.instagram;
  return url
    ? `<a class="social-icon" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(accessibleLabel)}" title="${escapeHTML(label)}">${glyph}</a>`
    : `<span class="social-icon social-icon-pending" aria-label="${escapeHTML(label)} link coming soon">${glyph}</span>`;
}

function aboutPage() {
  const a = content.about;
  return `
    <main id="main" class="inner-page">
      <section class="inner-hero">
        <p class="eyebrow">Why this exists</p>
        <h1>${a.title}</h1>
        <p class="hero-copy">${a.body}</p>
      </section>
      <section class="principles" aria-label="Club principles">
        ${a.principles.map((principle, index) => `<div><span>0${index + 1}</span><p>${principle}</p></div>`).join("")}
      </section>
      <section class="plain-cta">
        <h2>You do not have to prove you belong here.</h2>
        <p>Listen closely. Make something. Say hello. That is enough.</p>
        ${safeLink(linkFor("discord"), "Join the club", "button button-primary")}
      </section>
    </main>`;
}

function connectPage() {
  const c = content.connect;
  const items = [
    ["Discord", c.discordText, "discord", "Enter the clubhouse"],
    ["Etsy", c.etsyText, "etsy", "Visit the shop"],
    ["Instagram", c.instagramText, "instagram", "Follow along"]
  ];
  return `
    <main id="main" class="inner-page">
      <section class="inner-hero compact">
        <p class="eyebrow">Connect</p>
        <h1>${c.title}</h1>
        <p class="hero-copy">${c.intro}</p>
      </section>
      <section class="connect-list">
        ${items.map(([title, text, key, label], index) => `
          <article>
            <p class="card-number">0${index + 1}</p>
            <div><h2>${title}</h2><p>${text}</p></div>
            ${safeLink(linkFor(key), label)}
          </article>`).join("")}
      </section>
    </main>`;
}

function render() {
  document.documentElement.style.setProperty("--ink", content.theme.ink);
  document.documentElement.style.setProperty("--paper", content.theme.paper);
  document.documentElement.style.setProperty("--red", content.theme.red);
  document.documentElement.style.setProperty("--yellow", content.theme.yellow);
  document.documentElement.style.setProperty("--muted", content.theme.muted);

  const page = document.body.dataset.page;
  const pages = { home: homePage, about: aboutPage, connect: connectPage };
  document.body.innerHTML = page === "home"
    ? '<a class="skip-link" href="#main">Skip to content</a>' + homePage()
    : header() + (pages[page] || homePage)() + footer();

  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");
  button?.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });

  const current = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".site-nav a").forEach((link) => {
    if (link.getAttribute("href") === current || (current === "/" && link.getAttribute("href") === "/")) {
      link.setAttribute("aria-current", "page");
    }
  });

  if (page === "home") loadDispatches();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function formatPost(value) {
  return escapeHTML(value)
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
    .replace(/\+\+(.+?)\+\+/gs, "<u>$1</u>")
    .replace(/~~(.+?)~~/gs, "<s>$1</s>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}

async function loadPublicSettings() {
  try {
    const response = await fetch("/api/site-settings");
    if (!response.ok) return;
    const settings = await response.json();
    Object.assign(content.home, {
      aboutTitle: settings.aboutTitle,
      aboutText: settings.aboutText,
      dispatchesTitle: settings.dispatchesTitle,
      dispatchesIntro: settings.dispatchesIntro
    });
    content.socials = settings.socials;
    document.querySelector("#about h2")?.replaceChildren(document.createTextNode(content.home.aboutTitle));
    const aboutText = document.querySelector("#about > p:last-child");
    if (aboutText) aboutText.textContent = content.home.aboutText;
    document.querySelector("#dispatches-title")?.replaceChildren(document.createTextNode(content.home.dispatchesTitle));
    const dispatchesIntro = document.querySelector(".dispatches-heading > p");
    if (dispatchesIntro) dispatchesIntro.textContent = content.home.dispatchesIntro;
    const groups = document.querySelectorAll(".landing-social-bar .social-group");
    [settings.socials.slice(0, 2), settings.socials.slice(2)].forEach((socials, index) => {
      const group = groups[index];
      if (!group) return;
      group.querySelectorAll(".social-icon").forEach((icon) => icon.remove());
      const template = document.createElement("template");
      template.innerHTML = socials.map(socialLinkFor).join("");
      group.append(template.content);
    });
  } catch { /* Static defaults remain available if settings cannot load. */ }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

let dispatchCursor = null;
let dispatchBusy = false;
async function loadDispatches(append = false) {
  if (dispatchBusy) return;
  dispatchBusy = true;
  const list = document.querySelector("#dispatch-list");
  const more = document.querySelector("#load-more");
  if (!append) list.innerHTML = '<p class="feed-message">Loading dispatches…</p>';
  try {
    const url = new URL("/api/updates", location.origin);
    if (dispatchCursor && append) url.searchParams.set("before", dispatchCursor);
    const response = await fetch(url);
    if (!response.ok) throw new Error("feed unavailable");
    const data = await response.json();
    if (!append) list.replaceChildren();
    if (!data.items.length && !append) list.innerHTML = '<p class="feed-message">Our first dispatch is on its way. Come back soon.</p>';
    for (const post of data.items) {
      const article = document.createElement("article");
      article.className = "dispatch-post";
      if (post.images?.length) article.classList.add("has-image");
      const images = post.images?.length ? `<div class="dispatch-thumbnail-wrap"><img class="dispatch-thumbnail" src="${escapeHTML(post.images[0].url)}" alt="${escapeHTML(post.images[0].alt || "Club update photo")}" loading="lazy">${post.images.length > 1 ? `<span class="dispatch-image-count">+${post.images.length - 1}</span>` : ""}</div>` : "";
      article.innerHTML = `${images}<div class="dispatch-card-copy"><p class="dispatch-date"><time datetime="${escapeHTML(post.createdAt)}">${escapeHTML(formatDate(post.createdAt))}</time></p><p class="dispatch-body">${formatPost(post.body)}</p></div>`;
      list.append(article);
    }
    dispatchCursor = data.nextCursor;
    more.hidden = !dispatchCursor;
  } catch {
    if (!append) list.innerHTML = '<p class="feed-message">Dispatches are taking a little longer to come through. Please check back soon.</p>';
  } finally {
    dispatchBusy = false;
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#load-more")) loadDispatches(true);
});

render();
loadPublicSettings();
