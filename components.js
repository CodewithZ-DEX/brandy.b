import { subscribeAuth, getAdminSession } from "./auth.js";

const NAV_ITEMS = [
  { href: "index.html", label: "Home" },
  { href: "services.html", label: "Services" },
  { href: "work.html", label: "Proof of Work" },
  { href: "pricing.html", label: "Pricing" },
  { href: "ai-studio.html", label: "AI Studio" },
  { href: "contact.html", label: "Contact" },
];

export function renderShell(activeHref) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="container nav-inner">
        <a href="index.html" class="brand-logo" aria-label="Brandy Home">
          <span class="brand-mark">B</span>
          <span>Brandy</span>
          <span class="brand-domain">brandy.netlify</span>
        </a>
        <ul class="nav-links" id="primary-nav">
          ${NAV_ITEMS.map(
            (item) =>
              `<li><a href="${item.href}" ${item.href === activeHref ? 'aria-current="page"' : ""}>${item.label}</a></li>`
          ).join("")}
        </ul>
        <div class="nav-actions" id="nav-auth-actions">
          <a href="login.html" class="btn btn-ghost btn-sm">Sign in</a>
          <a href="pricing.html" class="btn btn-primary btn-sm">Start $100/wk</a>
        </div>
        <button class="mobile-toggle" id="mobile-menu-btn" aria-label="Toggle navigation" aria-expanded="false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    const toggle = header.querySelector("#mobile-menu-btn");
    toggle?.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    const actions = header.querySelector("#nav-auth-actions");
    const admin = getAdminSession();
    subscribeAuth((user) => {
      if (!actions) return;
      if (admin) {
        actions.innerHTML = `
          <a href="admin.html" class="btn btn-secondary btn-sm">Admin Console</a>
          <a href="dashboard.html" class="btn btn-primary btn-sm">Portal</a>
        `;
      } else if (user) {
        actions.innerHTML = `
          <a href="dashboard.html" class="btn btn-secondary btn-sm">Dashboard</a>
          <a href="pricing.html" class="btn btn-primary btn-sm">Upgrade</a>
        `;
      }
    });
  }

  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="brand-logo" style="color:#fff;margin-bottom:12px">
              <span class="brand-mark">B</span>
              <span>Brandy</span>
            </a>
            <p style="font-size:14px;max-width:34ch;color:#94a3b8">
              Full-stack digital marketing, short-form content production, and high-converting brand websites engineered for measurable growth.
            </p>
            <p style="font-size:13px;color:#cbd5e1;margin-top:14px">
              Direct Email: <a href="mailto:creativepawan89@gmail.com" style="color:#93c5fd;text-decoration:underline">creativepawan89@gmail.com</a>
            </p>
          </div>
          <div>
            <div class="footer-title">Services</div>
            <ul class="footer-links">
              <li><a href="services.html#social">Social & Short-Form Video</a></li>
              <li><a href="services.html#content">Blogs, Guides & Case Studies</a></li>
              <li><a href="services.html#web">Brand Websites & CRO</a></li>
              <li><a href="ai-studio.html">Gemini AI Strategist</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-title">Company</div>
            <ul class="footer-links">
              <li><a href="work.html">Proof of Work</a></li>
              <li><a href="pricing.html">Pricing ($100/wk • $800/mo)</a></li>
              <li><a href="contact.html">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-title">Portals</div>
            <ul class="footer-links">
              <li><a href="login.html">Client Sign In / Google</a></li>
              <li><a href="dashboard.html">Client Dashboard</a></li>
              <li><a href="admin.html">Administrator Console</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Brandy Digital Agency (brandy.netlify.app). All rights reserved.</span>
          <span>Powered by Netlify, Firebase & Gemini AI</span>
        </div>
      </div>
    `;
  }
}

export function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}
