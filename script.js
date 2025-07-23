const form = document.getElementById("dataForm");
const tableBody = document.querySelector("#dataTable tbody");

const fieldIds = [
  "month", "bookingDate", "bookingYear", "drNumber", "drAmt", "serviceAmt",
  "drDate", "deliveryDate", "company", "poNumber", "agent", "days", "terms",
  "collectionDate", "paymentDetails", "prcg", "collected", "paymentAmt", "ewt",
  "balance", "dataCollected", "numDays", "remarks", "monthCollected",
  "commissionStatus", "commissionReleasing"
];

// Load entries on page load
document.addEventListener("DOMContentLoaded", renderTable);

// Handle form submission
form.addEventListener("submit", e => {
  e.preventDefault();

  const entry = {};
  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    let val = input.value.trim();

    // FORCE collected, dataCollected, monthCollected empty on new entries
    if (id === "collected" || id === "dataCollected" || id === "monthCollected") {
      val = "";
    }

    entry[id] = input.type === "number" && val !== "" ? parseFloat(val) : val;
  });

  const saved = JSON.parse(localStorage.getItem("entries") || "[]");
  saved.push(entry);
  localStorage.setItem("entries", JSON.stringify(saved));

  form.reset();
  renderTable();
});

// Render table
function renderTable() {
  tableBody.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("entries") || "[]");
  saved.forEach((entry, index) => addRow(entry, index));
}

// Add row to table
function addRow(data, index) {
  const row = document.createElement("tr");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPaid = (
    data.dataCollected &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.dataCollected) &&
    !isNaN(new Date(data.dataCollected).getTime())
  ) || (
    data.collected?.trim() !== "" ||
    data.monthCollected?.trim() !== ""
  );

  let isOverdue = false;
  let isOnTime = false;
  let isDueToday = false;

  if (!isPaid && data.collectionDate) {
    const collectionDate = new Date(data.collectionDate + "T00:00:00");
    if (!isNaN(collectionDate.getTime())) {
      if (collectionDate < today) {
        isOverdue = true;
      } else if (collectionDate.getTime() === today.getTime()) {
        isDueToday = true;
      } else {
        isOnTime = true;
      }
    }
  }

  const status = isPaid
    ? "Paid"
    : isOverdue
    ? "Overdue"
    : isDueToday
    ? "Due Today"
    : isOnTime
    ? "On Time"
    : "";

  if (isPaid) row.classList.add("paid");
  else if (isOverdue) row.classList.add("overdue");

  const showNotCollected = !isPaid && isOverdue;

  fieldIds.forEach(id => {
    const td = document.createElement("td");
    let val = data[id] ?? "";

    if (showNotCollected && (id === "collected" || id === "dataCollected" || id === "monthCollected")) {
      val = "Not yet collected";
    }

    if (id === "collectionDate") {
      td.textContent = val;

      td.addEventListener("dblclick", () => {
        const input = document.createElement("input");
        input.type = "date";
        input.value = val;
        td.textContent = "";
        td.appendChild(input);
        input.focus();

        input.addEventListener("blur", () => {
          const newVal = input.value;
          const saved = JSON.parse(localStorage.getItem("entries") || "[]");
          const item = saved[index];
          if (!item) return;

          item[id] = newVal;
          localStorage.setItem("entries", JSON.stringify(saved));
          renderTable();
        });
      });
    } else {
      td.textContent = (typeof val === "number" && !["bookingYear", "days", "numDays"].includes(id))
        ? `₱${val.toFixed(2)}`
        : val;

      td.dataset.id = id;
      td.dataset.index = index;

      td.addEventListener("dblclick", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = val;
        td.textContent = "";
        td.appendChild(input);
        input.focus();

        input.addEventListener("blur", () => {
          const newVal = input.value.trim();
          const saved = JSON.parse(localStorage.getItem("entries") || "[]");
          const item = saved[index];
          if (!item) return;

          item[id] = isNaN(newVal) ? newVal : parseFloat(newVal);
          localStorage.setItem("entries", JSON.stringify(saved));
          renderTable();
        });
      });
    }
    row.appendChild(td);
  });

  // Status
  const statusTd = document.createElement("td");
  statusTd.textContent = status;
  row.appendChild(statusTd);

  // Mark as Paid
  const markPaidTd = document.createElement("td");
  const markPaidBtn = document.createElement("button");
  markPaidBtn.textContent = "✔️";
  markPaidBtn.classList.add("mark-paid-btn");
  markPaidBtn.dataset.index = index;
  markPaidTd.appendChild(markPaidBtn);
  row.appendChild(markPaidTd);

  // Delete
  const deleteTd = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.dataset.index = index;
  deleteTd.appendChild(deleteBtn);
  row.appendChild(deleteTd);

  tableBody.appendChild(row);
}

// Handle button clicks
tableBody.addEventListener("click", e => {
  const index = Number(e.target.dataset.index);
  const saved = JSON.parse(localStorage.getItem("entries") || "[]");

  if (e.target.classList.contains("delete-btn")) {
    saved.splice(index, 1);
    localStorage.setItem("entries", JSON.stringify(saved));
    renderTable();
  }

  if (e.target.classList.contains("mark-paid-btn")) {
    const item = saved[index];
    if (!item) return;

    const isPaid = (
      item.dataCollected &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.dataCollected) &&
      !isNaN(new Date(item.dataCollected).getTime())
    ) || (
      item.collected?.trim() !== "" ||
      item.monthCollected?.trim() !== ""
    );

    if (isPaid) {
      // Unmark as paid
      item.dataCollected = "";
      item.collected = "";
      item.monthCollected = "";
    } else {
      // Mark as paid
      const now = new Date();
      item.dataCollected = now.toISOString().slice(0, 10);
      item.collected = "Yes";
      item.monthCollected = now.toLocaleString("default", { month: "long", year: "numeric" });
    }

    localStorage.setItem("entries", JSON.stringify(saved));
    renderTable();
  }
});
