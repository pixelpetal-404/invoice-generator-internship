renderMasthead("preview");

const mount = document.getElementById("content-mount");
const id = qs("id");

function emptyState() {
  mount.innerHTML = `
    <div class="empty-state">
      <div class="glyph">¶</div>
      <h2>No invoice selected</h2>
      <p>Create a new invoice, or pick one up from the archive to preview it here.</p>
      <a class="btn btn-primary" href="index.html">+ New invoice</a>
    </div>`;
}

function statusLabel(status) {
  return { draft: "Draft", sent: "Awaiting payment", paid: "Paid", overdue: "Overdue" }[status] || "Draft";
}

function render(inv) {
  const t = computeTotals(inv);
  const status = deriveStatus(inv);

  mount.innerHTML = `
    <div class="invoice-toolbar no-print">
      <div>
        <h1 style="margin-bottom:2px;">${inv.invoiceNumber}</h1>
        <p class="subtext" style="margin-bottom:0;">Billed to ${inv.clientName || "—"}</p>
      </div>
      <div class="btn-row">
        <a class="btn btn-ghost" href="history.html">Archive</a>
        <a class="btn btn-ghost" href="index.html?edit=${encodeURIComponent(inv.id)}">Edit</a>
        ${status !== "paid" ? `<button class="btn btn-brass" id="mark-paid">Mark as paid</button>` : `<button class="btn btn-ghost" id="mark-unpaid">Reopen invoice</button>`}
        <button class="btn btn-primary" id="print-btn">Print / Save PDF</button>
      </div>
    </div>

    <div class="invoice-doc">
      <div class="invoice-doc-head">
        <div>
          <div class="from-name">${inv.fromName || "Your business name"}</div>
          <div class="from-meta">${inv.fromAddress || ""}</div>
        </div>
        <div class="doc-meta">
          <div class="doc-title">Invoice</div>
          <div class="doc-number">${inv.invoiceNumber}</div>
          <div>Issued ${formatDateLong(inv.issueDate)}</div>
          <div>Due ${formatDateLong(inv.dueDate)}</div>
        </div>
      </div>

      <div class="bill-to-row">
        <div>
          <div class="block-label">Bill to</div>
          <div class="client-name">${inv.clientName || "—"}</div>
          <div class="block-body">${inv.clientAddress || ""}</div>
        </div>
        <div style="text-align:right;">
          <div class="block-label">Status</div>
          <span class="stamp ${status}">${statusLabel(status)}</span>
        </div>
      </div>

      <table class="doc-items">
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qty</th>
            <th class="num">Rate</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items
            .map(
              (it) => `
            <tr>
              <td>${it.description || "—"}</td>
              <td class="num">${it.qty}</td>
              <td class="num">${money(it.rate)}</td>
              <td class="num">${money((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="totals-row"><span>Subtotal</span><span class="val">${money(t.subtotal)}</span></div>
        ${inv.discountPct ? `<div class="totals-row"><span>Discount (${inv.discountPct}%)</span><span class="val">−${money(t.discountAmt)}</span></div>` : ""}
        ${inv.taxPct ? `<div class="totals-row"><span>Tax (${inv.taxPct}%)</span><span class="val">${money(t.taxAmt)}</span></div>` : ""}
        <div class="totals-row grand"><span>Total due</span><span class="val">${money(t.total)}</span></div>
      </div>

      ${inv.notes ? `<div class="doc-notes"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
    </div>
  `;

  document.getElementById("print-btn").addEventListener("click", () => window.print());

  const paidBtn = document.getElementById("mark-paid");
  if (paidBtn) paidBtn.addEventListener("click", () => {
    inv.status = "paid";
    Store.upsert(inv);
    render(inv);
    showToast("Marked as paid.");
  });

  const unpaidBtn = document.getElementById("mark-unpaid");
  if (unpaidBtn) unpaidBtn.addEventListener("click", () => {
    inv.status = "sent";
    Store.upsert(inv);
    render(inv);
    showToast("Reopened invoice.");
  });
}

let target = id ? Store.get(id) : null;
if (!target) {
  const all = Store.all();
  target = all[0] || null;
}
if (target) render(target);
else emptyState();
