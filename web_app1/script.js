const employees = [
  {
    name: "Emma Johnson",
    address: "12 Elm Street, Boston",
    company: "TechNova",
    phone: "+1 (617) 555-1023",
    image: "https://i.pravatar.cc/160?img=32"
  },
  {
    name: "Liam Smith",
    address: "58 Sunset Blvd, Los Angeles",
    company: "SkyWorks",
    phone: "+1 (310) 555-2178",
    image: "https://i.pravatar.cc/160?img=12"
  },
  {
    name: "Olivia Brown",
    address: "220 Pine Ave, Seattle",
    company: "GreenSoft",
    phone: "+1 (206) 555-3930",
    image: "https://i.pravatar.cc/160?img=47"
  },
  {
    name: "Noah Davis",
    address: "75 Oak Lane, Austin",
    company: "TechNova",
    phone: "+1 (512) 555-4412",
    image: "https://i.pravatar.cc/160?img=68"
  },
  {
    name: "Ava Miller",
    address: "9 Harbor Road, Miami",
    company: "BluePeak",
    phone: "+1 (305) 555-1907",
    image: "https://i.pravatar.cc/160?img=5"
  },
  {
    name: "Ethan Wilson",
    address: "404 Market St, San Francisco",
    company: "SkyWorks",
    phone: "+1 (415) 555-2601",
    image: "https://i.pravatar.cc/160?img=22"
  },
  {
    name: "Sophia Moore",
    address: "118 River View, Chicago",
    company: "BluePeak",
    phone: "+1 (312) 555-3349",
    image: "https://i.pravatar.cc/160?img=44"
  },
  {
    name: "James Taylor",
    address: "66 Maple Dr, Denver",
    company: "GreenSoft",
    phone: "+1 (720) 555-2814",
    image: "https://i.pravatar.cc/160?img=15"
  }
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSelectedCompanies() {
  return $(".company-check:checked")
    .map(function collectValues() {
      return $(this).val();
    })
    .get();
}

function renderFilters() {
  const companies = [...new Set(employees.map((employee) => employee.company))].sort();
  const filtersHtml = companies
    .map(
      (company) => `
      <div class="form-check">
        <input class="form-check-input company-check" type="checkbox" value="${escapeHtml(company)}" id="company-${escapeHtml(company)}">
        <label class="form-check-label" for="company-${escapeHtml(company)}">${escapeHtml(company)}</label>
      </div>
    `
    )
    .join("");

  $("#companyFilters").html(filtersHtml);
}

function cardTemplate(employee) {
  return `
    <div class="col-sm-6 col-xl-4 employee-col">
      <article class="employee-card shadow-sm">
        <div class="d-flex align-items-start gap-3 mb-2">
          <img src="${escapeHtml(employee.image)}" alt="${escapeHtml(employee.name)}" class="employee-avatar">
          <div>
            <h5 class="employee-name">${escapeHtml(employee.name)}</h5>
            <p class="info-line mb-1"><span class="label-strong">Company:</span> ${escapeHtml(employee.company)}</p>
          </div>
        </div>
        <p class="info-line"><span class="label-strong">Address:</span> ${escapeHtml(employee.address)}</p>
        <p class="info-line mb-0"><span class="label-strong">Phone:</span> ${escapeHtml(employee.phone)}</p>
      </article>
    </div>
  `;
}

function renderEmployees() {
  const selectedCompanies = getSelectedCompanies();
  const visibleEmployees = selectedCompanies.length
    ? employees.filter((employee) => selectedCompanies.includes(employee.company))
    : employees;

  $("#resultsCount").text(`${visibleEmployees.length} result(s)`);

  const $grid = $("#employeeGrid");
  $grid.stop(true, true).fadeOut(140, () => {
    if (visibleEmployees.length === 0) {
      $grid.html(`
        <div class="col-12">
          <div class="empty-state">No employees match the selected companies.</div>
        </div>
      `);
    } else {
      $grid.html(visibleEmployees.map(cardTemplate).join(""));
    }

    $(".employee-col").hide().each(function animateCard(index) {
      $(this)
        .delay(index * 55)
        .slideDown(180);
    });

    $grid.fadeIn(220);
  });
}

$(document).ready(() => {
  renderFilters();
  renderEmployees();

  $(document).on("change", ".company-check", renderEmployees);

  $("#clearFilters").on("click", () => {
    $(".company-check").prop("checked", false);
    renderEmployees();
  });
});
