(function () {
  "use strict";

  const CFG = window.STORE_CONFIG || {};
  const PRODUCTS = window.PRODUCTS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const money = (n) => "Rs " + Number(n).toLocaleString("en-PK");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = (text) => `https://wa.me/${CFG.whatsappNumber}${text ? "?text=" + encodeURIComponent(text) : ""}`;
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const pageUrl = () => location.origin + location.pathname;

  /* ── Site-wide contact details ─────────────────────────── */
  function fillContact() {
    $$("[data-store-name]").forEach((el) => (el.textContent = CFG.storeName || el.textContent));
    $$("[data-delivery-note]").forEach((el) => (el.textContent = CFG.deliveryNote || ""));
    $$("[data-city]").forEach((el) => (el.textContent = CFG.city || ""));
    $$("[data-phone]").forEach((el) => (el.textContent = CFG.phoneDisplay || ""));
    const general = waLink(`Assalam o Alaikum ${CFG.storeName || ""}, I have a question about your products.`);
    $$("[data-wa-general]").forEach((el) => (el.href = general));
    if (CFG.email) {
      const a = $("[data-email]");
      a.href = "mailto:" + CFG.email;
      a.textContent = CFG.email;
      $("[data-email-wrap]").hidden = false;
    }
    const names = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
    $("#socials").innerHTML = Object.entries(CFG.socials || {})
      .filter(([, url]) => url)
      .map(([k, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${names[k] || k}">
          <svg class="icon" aria-hidden="true"><use href="#i-${k}"/></svg></a></li>`)
      .join("");
    $("#year").textContent = new Date().getFullYear();
  }

  /* ── Helpers per product ───────────────────────────────── */
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const hasRange = (p) => new Set(p.variants.map((v) => v.price)).size > 1;
  const optionLabel = (p) => (p.optionNames.length ? p.optionNames.join(" & ").toLowerCase() : "option");

  function priceHTML(p) {
    const min = minPrice(p);
    const v = p.variants.find((x) => x.price === min);
    const was = v && v.compareAt ? `<s>${money(v.compareAt)}</s>` : "";
    return hasRange(p) ? `<small>From</small> ${money(min)}${was}` : `${money(min)}${was}`;
  }

  function imgHTML(src, alt, eager) {
    if (!src) return `<div class="img-fallback">${esc(alt)}</div>`;
    return `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-fallback',textContent:this.alt}))">`;
  }

  function orderMessage(p, v, qty) {
    const lines = [
      `Assalam o Alaikum! I'd like to order:`,
      ``,
      `*${p.name}*`,
    ];
    if (v.label) lines.push(`${p.optionNames.join(" / ") || "Option"}: ${v.label}`);
    lines.push(`Quantity: ${qty}`);
    lines.push(`Price: ${money(v.price)}${qty > 1 ? " each" : ""}`);
    if (qty > 1) lines.push(`Total: ${money(v.price * qty)}`);
    lines.push(`Payment: Cash on delivery`);
    lines.push(``, `Name:`, `Full address:`, `City:`, `Phone:`, ``, `${pageUrl()}#${p.id}`);
    return lines.join("\n");
  }

  /* ── Grid & filters ────────────────────────────────────── */
  const state = { cat: "All", q: "" };
  const cats = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

  function renderFilters() {
    $("#filters").innerHTML = cats
      .map((c) => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${esc(c)}</button>`)
      .join("");
  }

  function cardHTML(p, i) {
    const single = p.variants.length === 1;
    const save = p.variants.some((v) => v.compareAt) ? `<span class="card__save">Sale</span>` : "";
    const cta = single
      ? `<a class="btn btn--wa" href="${waLink(orderMessage(p, p.variants[0], 1))}" target="_blank" rel="noopener">
           <svg class="icon" aria-hidden="true"><use href="#i-wa"/></svg>Order on WhatsApp</a>`
      : `<button type="button" class="btn btn--outline" data-open="${esc(p.id)}">Choose ${esc(optionLabel(p))}</button>`;
    return `<article class="card">
      <button type="button" class="card__media" data-open="${esc(p.id)}" aria-label="View ${esc(p.name)}">
        ${imgHTML(p.images[0], p.name, i < 4)}${save}
      </button>
      <p class="card__cat">${esc(p.category)}</p>
      <h3><button type="button" class="card__name" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
      <p class="price">${priceHTML(p)}</p>
      ${cta}
    </article>`;
  }

  function renderGrid() {
    const q = state.q.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (state.cat === "All" || p.category === state.cat) &&
      (!q || [p.name, p.subtitle, p.category].join(" ").toLowerCase().includes(q))
    );
    $("#grid").innerHTML = list.map(cardHTML).join("");
    $("#empty").hidden = list.length > 0;
    $("#count").textContent = list.length ? `${list.length} product${list.length === 1 ? "" : "s"}` : "";
  }

  /* ── Product sheet ─────────────────────────────────────── */
  const sheet = $("#sheet");
  let current = null, vIndex = 0, qty = 1;

  function updateSheet() {
    const v = current.variants[vIndex];
    $("#sheet-price").innerHTML = money(v.price) + (v.compareAt ? `<s>${money(v.compareAt)}</s>` : "");
    $("#qty-val").textContent = qty;
    $("#qty-minus").disabled = qty <= 1;
    $("#sheet-total").innerHTML = qty > 1 ? `Total <strong>${money(v.price * qty)}</strong>` : "";
    $("#sheet-order").href = waLink(orderMessage(current, v, qty));
  }

  function showImage(i) {
    const img = $("#sheet-img");
    img.classList.remove("is-broken");
    img.onerror = () => img.classList.add("is-broken");
    img.src = current.images[i] || "";
    img.alt = current.name;
    $$("#sheet-thumbs button").forEach((b, j) => b.setAttribute("aria-current", String(i === j)));
  }

  function openSheet(id, push = true) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    current = p; vIndex = 0; qty = 1;

    $("#sheet-cat").textContent = p.category;
    $("#sheet-title").textContent = p.name;
    $("#sheet-sub").textContent = p.subtitle;
    $("#sheet-sub").hidden = !p.subtitle;

    const thumbs = $("#sheet-thumbs");
    thumbs.innerHTML = p.images.length > 1
      ? p.images.map((src, i) => `<button type="button" data-img="${i}" aria-label="Photo ${i + 1}">${imgHTML(src, "", false)}</button>`).join("")
      : "";
    showImage(0);

    const fs = $("#sheet-variants");
    fs.hidden = p.variants.length < 2;
    $("#sheet-legend").textContent = p.optionNames.join(" / ") || "Option";
    $("#sheet-variant-list").innerHTML = p.variants
      .map((v, i) => `<label class="variant"><input type="radio" name="variant" value="${i}" ${i === 0 ? "checked" : ""}>
        <span>${esc(cap(v.label))}${hasRange(p) ? " · " + money(v.price) : ""}</span></label>`)
      .join("");

    $("#sheet-desc").innerHTML = (p.description || "")
      .split("\n").filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");

    updateSheet();
    if (!sheet.open) sheet.showModal();
    sheet.scrollTop = 0;
    if (push) history.replaceState(null, "", "#" + p.id);
  }

  function closeSheet() {
    if (sheet.open) sheet.close();
  }

  /* ── Events ────────────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) { openSheet(open.dataset.open); return; }
    const chip = e.target.closest("[data-cat]");
    if (chip) { state.cat = chip.dataset.cat; renderFilters(); renderGrid(); return; }
    const thumb = e.target.closest("[data-img]");
    if (thumb) { showImage(Number(thumb.dataset.img)); return; }
    if (e.target.closest("[data-close]")) closeSheet();
  });

  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); }); // backdrop
  sheet.addEventListener("close", () => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });
  $("#sheet-variant-list").addEventListener("change", (e) => { vIndex = Number(e.target.value); updateSheet(); });
  $("#qty-minus").addEventListener("click", () => { qty = Math.max(1, qty - 1); updateSheet(); });
  $("#qty-plus").addEventListener("click", () => { qty = Math.min(99, qty + 1); updateSheet(); });

  $("#search").addEventListener("input", (e) => { state.q = e.target.value; renderGrid(); });
  $("#clear").addEventListener("click", () => {
    state.q = ""; state.cat = "All"; $("#search").value = ""; renderFilters(); renderGrid();
  });

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && PRODUCTS.some((p) => p.id === id)) openSheet(id, false);
  }
  window.addEventListener("hashchange", openFromHash);

  /* ── Init ──────────────────────────────────────────────── */
  fillContact();
  renderFilters();
  renderGrid();
  openFromHash();
})();
