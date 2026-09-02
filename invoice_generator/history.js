renderMasthead("archive");

const tableMount = document.getElementById("table-mount");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");

function statusLabel(status) {
  return { draft: "Draft", sent: "Awaiting", paid: "Paid", overdue: "Overdue" }[status] || "Draft";
}

function matches(inv, term, status) {
  const t = term.trim().toLowerCase();
  const statusOk = !status || deriveStatus(inv) === status;
  if (!statusOk) return false;
  if (!t) return true;
  return (
    (inv.clientName || "").toLowerCase().includes(t) ||
    (inv.invoiceNumber || "").toLowerCase().includes(t)
  );
}

function renderTable() {
  const all = Store.all();
  const term = searchInput.value;
  const status = statusFilter.value;
  const list = all.filter((inv) => matches(inv, term, status));

  document.querySelector('[data-masthead] .ledger-no') &&
    (document.querySelector('[data-masthead] .ledger-no').textContent = `${all.length} invoice${all.length === 1 ? "" : "s"} on file`);

  if (all.length === 0) {
    tableMount.innerHTML = `
      <div class="empty-state">
        <div class="glyph">¶</div>
        <h2>The archive is empty</h2>
        <p>Invoices you save will be kept here, on this device, so you can find them again.</p>
        <a class="btn btn-primary" href="index.html">+ Create your first invoice</a>
      </div>`;
    return;
  }

  if (list.length === 0) {
    tableMount.innerHTML = `
      <div class="empty-state">
        <div class="glyph">¶</div>
        <h2>No matches</h2>
        <p>Nothing in the archive matches that search or filter.</p>
      </div>`;
    return;
  }

  tableMount.innerHTML = `
    <table class="archive-table">
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Client</th>
          <th>Issued</th>
          <th>Status</th>
          <th class="num">Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map((inv) => {
            const t = computeTotals(inv);
            const status = deriveStatus(inv);
            return `
            <tr>
              <td class="inv-no">${inv.invoiceNumber}</td>
              <td>${inv.clientName || "—"}</td>
              <td>${formatDateLong(inv.issueDate)}</td>
              <td><span class="badge ${status}">${statusLabel(status)}</span></td>
              <td class="num amount">${money(t.total)}</td>
              <td>
                <div class="row-actions">
                  <a href="preview.html?id=${encodeURIComponent(inv.id)}">View</a>
                  <a href="index.html?edit=${encodeURIComponent(inv.id)}">Edit</a>
                  <button class="danger" data-delete="${inv.id}">Delete</button>
                </div>
              </td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;

  tableMount.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inv = Store.get(btn.dataset.delete);
      if (!confirm(`Delete invoice ${inv ? inv.invoiceNumber : ""}? This can't be undone.`)) return;
      Store.remove(btn.dataset.delete);
      renderTable();
      showToast("Invoice deleted.");
    });
  });
}

searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
renderTable();
