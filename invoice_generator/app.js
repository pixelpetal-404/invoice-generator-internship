/* Shared utilities used across all three pages. */

const STORAGE_KEY = "ledger.invoices.v1";
const DRAFT_KEY = "ledger.draft.v1";

const Store = {
  all() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Could not read invoices", e);
      return [];
    }
  },
  save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },
  get(id) {
    return Store.all().find((inv) => inv.id === id) || null;
  },
  upsert(invoice) {
    const list = Store.all();
    const idx = list.findIndex((inv) => inv.id === invoice.id);
    if (idx >= 0) list[idx] = invoice;
    else list.unshift(invoice);
    Store.save(list);
    return invoice;
  },
  remove(id) {
    Store.save(Store.all().filter((inv) => inv.id !== id));
  },
  nextInvoiceNumber() {
    const count = Store.all().length + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count).padStart(3, "0")}`;
  },
};

function uid() {
  return "inv_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLong(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function computeTotals(invoice) {
  const subtotal = invoice.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  const discountAmt = subtotal * ((Number(invoice.discountPct) || 0) / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * ((Number(invoice.taxPct) || 0) / 100);
  const total = taxable + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}

function deriveStatus(invoice) {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "sent" && invoice.dueDate && invoice.dueDate < todayISO()) return "overdue";
  return invoice.status || "draft";
}

function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("is-visible"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
}

/** Renders the binder-tab nav + masthead into any element with [data-masthead]. */
function renderMasthead(activePage, ledgerNoText) {
  const mount = document.querySelector("[data-masthead]");
  if (!mount) return;
  const tabs = [
    { id: "new", href: "index.html", label: "New Invoice", index: "01" },
    { id: "preview", href: "preview.html", label: "Preview", index: "02" },
    { id: "archive", href: "history.html", label: "Archive", index: "03" },
  ];
  mount.innerHTML = `
    <div class="masthead">
      <div class="brand">
        <span class="brand-mark">Ledger</span>
        <span class="brand-tag">Invoice Book</span>
      </div>
      <div class="ledger-no">${ledgerNoText || ""}</div>
    </div>
    <nav class="binder-tabs">
      ${tabs
        .map(
          (t) => `
        <a class="binder-tab ${t.id === activePage ? "is-active" : ""}" href="${t.href}">
          <span class="tab-index">${t.index}</span>${t.label}
        </a>`
        )
        .join("")}
    </nav>
  `;
}
