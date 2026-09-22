const content = window.LDC_CONTENT;
const features = content.features || {};

const linkFor = (key) => content.links[key] || "";

function safeLink(url, label, className = "text-link") {
  if (!url) {
    return `<span class="${className} is-disabled" aria-label="${label}, coming soon">${label}<small>coming soon</small></span>`;
  }
  return `<a class="${className}" href="${url}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
}

function header() {
  const oceansNav = features.oceansPage !== false ? '<a href="/oceans/">Oceans</a>' : "";
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="${content.brand.name} home">
        <span>LOCAL</span><span>DREAMERS</span><span>CLUB</span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Main navigation">
        <a href="/">Home</a>
        ${oceansNav}
        <a href="/about/">About</a>
        <a href="/connect/">Connect</a>
      </nav>
    </header>`;
}

function footer() {
  const instagram = features.instagram !== false ? safeLink(linkFor("instagram"), "Instagram") : "";
  const etsy = features.etsy !== false ? safeLink(linkFor("etsy"), "Etsy") : "";
  return `
    <footer class="site-footer">
      <p>${content.brand.footerNote}</p>
      <div class="footer-links">${instagram}${etsy}</div>
      <p class="fine-print">Independent fan community. Not affiliated with any artist, label, festival, or venue.</p>
    </footer>`;
}

function communityPreview() {
  if (features.communityPreview === false || !content.community) return "";
  const cards = (content.community.items || []).map((item) => `
    <article class="path-card community-card">
      <p class="card-number">${item.label}</p>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
      ${safeLink(linkFor(item.link), "Join the conversation")}
    </article>`).join("");

  return `
    <section class="section-heading">
      <p class="stamp">${content.community.title}</p>
      <h2>${content.community.intro}</h2>
    </section>
    <section class="path-grid community-grid" aria-label="From the club">${cards}</section>`;
}

function shopPreview() {
  if (features.shopPreview === false || features.etsy === false || !content.shop) return "";

  if (!content.shop.items || content.shop.items.length === 0) {
    return `
      <section class="shop-preview">
        <div>
          <p class="stamp">${content.shop.title}</p>
          <h2>${content.shop.intro}</h2>
        </div>
        ${safeLink(linkFor("etsy"), "Visit the shop", "button button-quiet")}
      </section>`;
  }

  return `
    <section class="shop-preview">
      <div>
        <p class="stamp">${content.shop.title}</p>
        <h2>${content.shop.intro}</h2>
      </div>
      ${safeLink(linkFor("etsy"), "Visit the shop", "button button-quiet")}
    </section>`;
}

function homePage() {
  const cards = content.home.paths.map((item) => `
    <article class="path-card">
      <p class="card-number">${item.number}</p>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
      ${safeLink(linkFor(item.link), item.linkLabel)}
    </article>`).join("");

  const joinButton = features.discord !== false
    ? safeLink(linkFor("discord"), "Join the conversation", "button button-primary")
    : "";

  const oceansButton = features.oceansPage !== false
    ? '<a class="button button-quiet" href="/oceans/">Oceans Calling <span aria-hidden="true">→</span></a>'
    : "";

  const paths = features.homeMeetShareBelong !== false
    ? `<section class="intro-strip"><p>${content.home.intro}</p></section>
       <section class="path-grid" aria-label="Ways to take part">${cards}</section>`
    : "";

  const pulse = features.homeClubPulse !== false
    ? `<section class="club-pulse">
        <p class="stamp">NOW IN THE CLUB</p>
        <div><h2>${content.home.pulseTitle}</h2><p>${content.home.pulseText}</p></div>
        ${features.oceansPage !== false ? '<a class="button button-light" href="/oceans/">Enter Oceans Calling <span aria-hidden="true">→</span></a>' : ""}
      </section>`
    : "";

  return `
    <main id="main">
      <section class="hero home-hero">
        <p class="eyebrow">${content.brand.eyebrow}</p>
        <h1><span>${content.brand.statement.split(" ")[0]}</span><span>${content.brand.statement.split(" ")[1]}</span><span>${content.brand.statement.split(" ")[2]}</span></h1>
        <p class="hero-copy">${content.brand.description}</p>
        <div class="hero-actions">${joinButton}${oceansButton}</div>
        <div class="thread-line" aria-hidden="true"></div>
      </section>
      ${paths}
      ${communityPreview()}
      ${shopPreview()}
      ${pulse}
    </main>`;
}

function oceansPage() {
  const o = content.oceans;
  if (features.oceansPage === false) {
    return `<main id="main" class="inner-page"><section class="inner-hero"><p class="eyebrow">Local Dreamers Club</p><h1>This page is resting.</h1><p class="hero-copy">The Oceans Calling page is currently turned off.</p></section></main>`;
  }

  return `
    <main id="main" class="oceans-main">
      <section class="oceans-hero">
        <div class="ocean-signal" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="eyebrow">${o.label}</p>
        <h1>${o.title}</h1>
        <p class="hero-copy">${o.intro}</p>
        <div class="hero-actions">
          ${features.discord !== false ? safeLink(linkFor("discord"), o.primaryButton, "button button-primary") : ""}
          <a class="button button-quiet" href="/about/">${o.secondaryButton} <span aria-hidden="true">→</span></a>
        </div>
        <div class="event-meta"><span>${o.place}</span><span>${o.date}</span></div>
      </section>
      <section class="memory-card">
        <p class="stamp">AFTER THE MUSIC</p>
        <blockquote>${o.prompt}</blockquote>
        <p>${o.note}</p>
      </section>
      <section class="oceans-close">
        <p>YOU FOUND ANOTHER DREAMER.</p>
        <a href="/connect/">Stay in touch <span aria-hidden="true">→</span></a>
      </section>
    </main>`;
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
        ${features.discord !== false ? safeLink(linkFor("discord"), "Join the club", "button button-primary") : ""}
      </section>
    </main>`;
}

function connectPage() {
  const c = content.connect;
  const items = [
    features.discord !== false && ["Discord", c.discordText, "discord", "Enter the clubhouse"],
    features.etsy !== false && ["Etsy", c.etsyText, "etsy", "Visit the shop"],
    features.instagram !== false && ["Instagram", c.instagramText, "instagram", "Follow along"]
  ].filter(Boolean);

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
  const pages = { home: homePage, oceans: oceansPage, about: aboutPage, connect: connectPage };
  document.body.innerHTML = header() + (pages[page] || homePage)() + footer();

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
}

render();
