const STORAGE_KEY = "peoplepulse-selected-companies";

let employees = [];
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Stable HTML id fragment from company name */
function slugifyCompany(company) {
  return String(company)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "company";
}

function getSelectedCompanies() {
  return Array.from(document.querySelectorAll(".company-check:checked")).map(
    (el) => el.value
  );
}

function saveFilterSelection() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSelectedCompanies()));
  } catch {
    /* ignore quota / private mode */
  }
}

function loadFilterSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyStoredFilters() {
  const saved = loadFilterSelection();
  if (!saved.length) return;
  document.querySelectorAll(".company-check").forEach((cb) => {
    cb.checked = saved.includes(cb.value);
  });
}

function renderFilters() {
  const container = document.getElementById("companyFilters");
  const companies = [...new Set(employees.map((e) => e.company))].sort();
  const usedSlugs = new Set();
  container.innerHTML = companies
    .map((company) => {
      let slug = slugifyCompany(company);
      while (usedSlugs.has(slug)) {
        slug = `${slug}-x`;
      }
      usedSlugs.add(slug);
      const id = `company-${slug}`;
      return `
      <div class="form-check">
        <input class="form-check-input company-check" type="checkbox" value="${escapeHtml(company)}" id="${id}">
        <label class="form-check-label" for="${id}">${escapeHtml(company)}</label>
      </div>`;
    })
    .join("");
  applyStoredFilters();
}

function getSearchQuery() {
  const el = document.getElementById("employeeSearch");
  return el ? el.value.trim().toLowerCase() : "";
}

function getSortValue() {
  const el = document.getElementById("employeeSort");
  return el ? el.value : "name-asc";
}

function filterAndSort(list) {
  const q = getSearchQuery();
  let out = list;
  if (q) {
    out = out.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        e.company.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q)
    );
  }
  const [field, dir] = getSortValue().split("-");
  const mult = dir === "desc" ? -1 : 1;
  out = [...out].sort((a, b) => {
    const va = (field === "company" ? a.company : a.name).toLowerCase();
    const vb = (field === "company" ? b.company : b.name).toLowerCase();
    return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
  });
  return out;
}

const AVATAR_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="%23334155" width="160" height="160"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%2393c5fd" font-family="system-ui,sans-serif" font-size="14">Photo</text></svg>'
  );

function cardTemplate(employee) {
  return `
    <div class="col-sm-6 col-xl-4 employee-col" role="listitem">
      <article class="employee-card shadow-sm">
        <div class="d-flex align-items-start gap-3 mb-2">
          <img src="${escapeHtml(employee.image)}" alt="${escapeHtml(employee.name)} portrait" class="employee-avatar" width="72" height="72" loading="lazy">
          <div>
            <h5 class="employee-name">${escapeHtml(employee.name)}</h5>
            <p class="info-line mb-1"><span class="label-strong">Company:</span> ${escapeHtml(employee.company)}</p>
          </div>
        </div>
        <p class="info-line"><span class="label-strong">Address:</span> ${escapeHtml(employee.address)}</p>
        <p class="info-line mb-0"><span class="label-strong">Phone:</span> ${escapeHtml(employee.phone)}</p>
      </article>
    </div>`;
}

function attachAvatarFallbacks(root) {
  root.querySelectorAll(".employee-avatar").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.src = AVATAR_FALLBACK;
      },
      { once: true }
    );
  });
}

function setResultsCount(n) {
  const el = document.getElementById("resultsCount");
  el.textContent = `${n} result(s)`;
}

function renderEmployeeGridHtml(visibleEmployees, filtersActive) {
  const grid = document.getElementById("employeeGrid");
  if (visibleEmployees.length === 0) {
    const clearBtn =
      filtersActive || getSearchQuery()
        ? `<button type="button" class="btn btn-sm btn-outline-light mt-3" id="emptyClearFilters">Clear filters &amp; search</button>`
        : "";
    grid.innerHTML = `
      <div class="col-12" role="listitem">
        <div class="empty-state">
          <p class="mb-0">No employees match the current filters or search.</p>
          ${clearBtn}
        </div>
      </div>`;
    const btn = document.getElementById("emptyClearFilters");
    if (btn) {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".company-check").forEach((c) => {
          c.checked = false;
        });
        const search = document.getElementById("employeeSearch");
        if (search) search.value = "";
        saveFilterSelection();
        renderEmployees();
      });
    }
    return;
  }
  grid.innerHTML = visibleEmployees.map(cardTemplate).join("");
  attachAvatarFallbacks(grid);
}

function animateCardsIfAllowed() {
  if (prefersReducedMotion()) return;
  const cols = document.querySelectorAll(".employee-col");
  cols.forEach((col, index) => {
    col.style.opacity = "0";
    col.style.transform = "translateY(8px)";
    window.requestAnimationFrame(() => {
      col.style.transition = `opacity 0.2s ease ${index * 0.04}s, transform 0.2s ease ${index * 0.04}s`;
      col.style.opacity = "1";
      col.style.transform = "translateY(0)";
    });
  });
}

function renderEmployees() {
  const selectedCompanies = getSelectedCompanies();
  const base = selectedCompanies.length
    ? employees.filter((e) => selectedCompanies.includes(e.company))
    : employees;
  const visibleEmployees = filterAndSort(base);
  setResultsCount(visibleEmployees.length);

  const grid = document.getElementById("employeeGrid");
  const run = () => {
    renderEmployeeGridHtml(visibleEmployees, selectedCompanies.length > 0);
    animateCardsIfAllowed();
  };

  if (prefersReducedMotion()) {
    run();
  } else {
    grid.style.opacity = "0";
    window.setTimeout(() => {
      run();
      grid.style.transition = "opacity 0.18s ease";
      grid.style.opacity = "1";
    }, 120);
  }
}

function wireNav() {
  const buttons = document.querySelectorAll("[data-nav]");
  const panels = document.querySelectorAll(".nav-panel");

  function activate(key) {
    buttons.forEach((btn) => {
      const is = btn.dataset.nav === key;
      btn.classList.toggle("active", is);
      btn.setAttribute("aria-current", is ? "page" : "false");
    });
    panels.forEach((panel) => {
      const show = panel.id === `panel-${key}`;
      panel.hidden = !show;
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activate(btn.dataset.nav);
    });
  });

  activate("home");
}

function showLoadError(message) {
  document.getElementById("employeeGrid").innerHTML = `
    <div class="col-12" role="listitem"><div class="empty-state">${escapeHtml(message)}</div></div>`;
}

async function init() {
  wireNav();

  try {
    const res = await fetch("employees.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    employees = await res.json();
  } catch {
    showLoadError(
      "Could not load employees.json. Serve this folder over HTTP (for example: npx --yes serve .) instead of opening the file directly."
    );
    return;
  }

  renderFilters();
  renderEmployees();

  document.getElementById("companyFilters").addEventListener("change", (e) => {
    if (e.target.classList.contains("company-check")) {
      saveFilterSelection();
      renderEmployees();
    }
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    document.querySelectorAll(".company-check").forEach((c) => {
      c.checked = false;
    });
    saveFilterSelection();
    renderEmployees();
  });

  const search = document.getElementById("employeeSearch");
  const sort = document.getElementById("employeeSort");
  if (search) {
    search.addEventListener("input", () => renderEmployees());
  }
  if (sort) {
    sort.addEventListener("change", () => renderEmployees());
  }

  document.querySelector(".skip-link")?.addEventListener("click", () => {
    const main = document.getElementById("main-content");
    if (main) window.requestAnimationFrame(() => main.focus());
  });
}

document.addEventListener("DOMContentLoaded", init);
