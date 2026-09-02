renderMasthead("new");

const itemsBody = document.getElementById("items-body");
const editId = qs("edit");
let items = [];

function blankItem() {
  return { id: uid(), description: "", qty: 1, rate: 0 };
}

function rowTemplate(item) {
  const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
  return `
    <tr data-row="${item.id}">
      <td><input type="text" class="f-desc" value="${escapeAttr(item.description)}" placeholder="Website design — homepage &amp; 3 subpages" /></td>
      <td class="num"><input type="number" class="f-qty" min="0" step="1" value="${item.qty}" /></td>
      <td class="num"><input type="number" class="f-rate" min="0" step="0.01" value="${item.rate}" /></td>
      <td class="amount-cell">${money(amount)}</td>
      <td><button type="button" class="row-remove" title="Remove line" aria-label="Remove line">&times;</button></td>
    </tr>`;
}

function escapeAttr(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderRows() {
  itemsBody.innerHTML = items.map(rowTemplate).join("");
  recalc();
}

function recalc() {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  const discountPct = Number(document.getElementById("discountPct").value) || 0;
  const taxPct = Number(document.getElementById("taxPct").value) || 0;
  const discountAmt = subtotal * (discountPct / 100);
  const taxAmt = (subtotal - discountAmt) * (taxPct / 100);
  const total = subtotal - discountAmt + taxAmt;
  document.getElementById("sum-subtotal").textContent = money(subtotal);
  document.getElementById("sum-total").textContent = money(total);
}

itemsBody.addEventListener("input", (e) => {
  const row = e.target.closest("tr");
  if (!row) return;
  const item = items.find((it) => it.id === row.dataset.row);
  if (!item) return;
  if (e.target.classList.contains("f-desc")) item.description = e.target.value;
  if (e.target.classList.contains("f-qty")) item.qty = e.target.value;
  if (e.target.classList.contains("f-rate")) item.rate = e.target.value;
  const amtCell = row.querySelector(".amount-cell");
  amtCell.textContent = money((Number(item.qty) || 0) * (Number(item.rate) || 0));
  recalc();
});

itemsBody.addEventListener("click", (e) => {
  if (!e.target.classList.contains("row-remove")) return;
  const row = e.target.closest("tr");
  items = items.filter((it) => it.id !== row.dataset.row);
  if (items.length === 0) items.push(blankItem());
  renderRows();
});

document.getElementById("add-row").addEventListener("click", () => {
  items.push(blankItem());
  renderRows();
});

document.getElementById("discountPct").addEventListener("input", recalc);
document.getElementById("taxPct").addEventListener("input", recalc);

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("Clear all fields on this form?")) return;
  populateForm(freshInvoice());
});

function freshInvoice() {
  return {
    id: uid(),
    invoiceNumber: Store.nextInvoiceNumber(),
    issueDate: todayISO(),
    dueDate: addDaysISO(todayISO(), 14),
    fromName: "",
    fromAddress: "",
    clientName: "",
    clientAddress: "",
    items: [blankItem()],
    discountPct: 0,
    taxPct: 0,
    notes: "Payment due within 14 days of receipt. Thank you for your business.",
    status: "draft",
  };
}

function populateForm(inv) {
  document.getElementById("fromName").value = inv.fromName || "";
  document.getElementById("fromAddress").value = inv.fromAddress || "";
  document.getElementById("clientName").value = inv.clientName || "";
  document.getElementById("clientAddress").value = inv.clientAddress || "";
  document.getElementById("invoiceNumber").value = inv.invoiceNumber;
  document.getElementById("issueDate").value = inv.issueDate;
  document.getElementById("dueDate").value = inv.dueDate;
  document.getElementById("discountPct").value = inv.discountPct || 0;
  document.getElementById("taxPct").value = inv.taxPct || 0;
  document.getElementById("notes").value = inv.notes || "";
  items = inv.items.length ? inv.items.map((it) => ({ ...it, id: it.id || uid() })) : [blankItem()];
  document.getElementById("invoice-form").dataset.editingId = inv.id;
  renderRows();
}

// Init: either edit an existing invoice, or start fresh.
if (editId) {
  const existing = Store.get(editId);
  populateForm(existing || freshInvoice());
} else {
  populateForm(freshInvoice());
}

document.getElementById("invoice-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const invoice = {
    id: document.getElementById("invoice-form").dataset.editingId || uid(),
    invoiceNumber: document.getElementById("invoiceNumber").value || Store.nextInvoiceNumber(),
    issueDate: document.getElementById("issueDate").value || todayISO(),
    dueDate: document.getElementById("dueDate").value,
    fromName: document.getElementById("fromName").value.trim(),
    fromAddress: document.getElementById("fromAddress").value.trim(),
    clientName: document.getElementById("clientName").value.trim(),
    clientAddress: document.getElementById("clientAddress").value.trim(),
    items: items.map((it) => ({ ...it, qty: Number(it.qty) || 0, rate: Number(it.rate) || 0 })),
    discountPct: Number(document.getElementById("discountPct").value) || 0,
    taxPct: Number(document.getElementById("taxPct").value) || 0,
    notes: document.getElementById("notes").value.trim(),
    status: (Store.get(document.getElementById("invoice-form").dataset.editingId) || {}).status || "draft",
    createdAt: (Store.get(document.getElementById("invoice-form").dataset.editingId) || {}).createdAt || new Date().toISOString(),
  };

  if (!invoice.clientName || !invoice.fromName) {
    showToast("Add both a business name and client name first.");
    return;
  }

  Store.upsert(invoice);
  window.location.href = `preview.html?id=${encodeURIComponent(invoice.id)}`;
});
