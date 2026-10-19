import { randomUserMock, additionalUsers } from "./FE4U-Lab2-mock.js";
import {
  formatAndMergeUsers,
  formatExtraUser,
  validateUser,
  sortUsers,
} from "./lab2.js";

let allUsers = [];
let currentSort = { field: "full_name", order: "asc" };
let searchQuery = "";
let currentPage = 1;
const PAGE_SIZE = 10;

function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return parts.map((p) => p[0].toUpperCase()).join(".");
}

function getDisplayedUsers() {
  let result = [...allUsers];

  const regionSelect = document.getElementById("region-select");
  const regionVal = regionSelect ? regionSelect.value : null;
  if (regionVal && regionVal !== "all") {
    result = result.filter(
      (u) => (u.country || "").toLowerCase() === regionVal.toLowerCase()
    );
  }

  const ageSelect = document.getElementById("age-select");
  const ageVal = ageSelect ? ageSelect.value : null;
  if (ageVal && ageVal !== "all") {
    const [min, max] = ageVal.split("-").map(Number);
    result = result.filter((u) => {
      if (u.age == null) return false;
      return max ? u.age >= min && u.age <= max : u.age >= min;
    });
  }

  const sexSelect = document.getElementById("sex-select");
  const sexVal = sexSelect ? sexSelect.value : null;
  if (sexVal && sexVal !== "all") {
    result = result.filter(
      (u) => (u.gender || "").toLowerCase() === sexVal.toLowerCase()
    );
  }

  const photoCheckbox = document.getElementById("photo-checkbox");
  const photoOnly = photoCheckbox ? photoCheckbox.checked : false;
  if (photoOnly) {
    result = result.filter((u) => Boolean(u.picture_large || u.picture_thumbnail));
  }

  const favCheckbox = document.getElementById("favourites-checkbox");
  const favOnly = favCheckbox ? favCheckbox.checked : false;
  if (favOnly) {
    result = result.filter((u) => Boolean(u.favorite));
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    const asNumber = Number(q);
    if (!isNaN(asNumber) && q !== "") {
      result = result.filter((u) => u.age === asNumber);
    } else {
      result = result.filter((u) => {
        const matchName = u.full_name && u.full_name.toLowerCase().includes(q);
        const matchNote = u.note && u.note.toLowerCase().includes(q);
        return Boolean(matchName || matchNote);
      });
    }
  }

  return result;
}

function renderTeacherCards(users) {
  const grid = document.querySelector(".teachers-grid");
  if (!grid) return;

  if (users.length === 0) {
    grid.innerHTML = `<p class="no-results">No teachers found.</p>`;
    return;
  }

  grid.innerHTML = users
    .map((user) => {
      const avatarHtml = user.picture_thumbnail
        ? `<img src="${user.picture_thumbnail}" alt="${user.full_name || ""}">`
        : `<span>${getInitials(user.full_name)}</span>`;

      const avatarClass = user.picture_thumbnail
        ? "teacher-avatar"
        : "teacher-avatar initials-avatar";

      const starHtml = user.favorite
        ? `<span class="favorite-star" aria-label="Favorite">★</span>`
        : "";

      return `
        <article class="teacher-card ${user.favorite ? "favorite" : ""}" data-user-id="${user.id}">
          <a href="#modal-teacher-info" class="teacher-card-link">
            <div class="${avatarClass}">
              ${avatarHtml}
              ${starHtml}
            </div>
            <h2 class="teacher-name">${user.full_name || "Unknown"}</h2>
            <p class="teacher-speciality">${user.course || "—"}</p>
            <p class="teacher-country">${user.country || "—"}</p>
          </a>
        </article>
      `;
    })
    .join("");
}

function openTeacherModal(user) {
  const modal = document.getElementById("modal-teacher-info");
  if (!modal || !user) return;

  modal.dataset.currentUserId = user.id;

  const photoEl = modal.querySelector(".teacher-detail-photo");
  if (photoEl) {
    if (user.picture_large) {
      photoEl.src = user.picture_large;
      photoEl.alt = user.full_name || "";
      photoEl.style.display = "";
    } else {
      photoEl.style.display = "none";
    }
  }

  const nameEl = modal.querySelector(".teacher-name-row h2");
  if (nameEl) nameEl.textContent = user.full_name || "Unknown";

  const starEl = modal.querySelector(".star-icon");
  if (starEl) {
    starEl.textContent = user.favorite ? "⭐" : "☆";
    starEl.title = user.favorite ? "Remove from favorites" : "Add to favorites";
    starEl.style.cursor = "pointer";
  }

  const specEl = modal.querySelector(".speciality-text");
  if (specEl) specEl.textContent = user.course || "—";

  const locEl = modal.querySelector(".location-text");
  if (locEl) {
    const parts = [user.city, user.country].filter(Boolean);
    locEl.textContent = parts.join(", ") || "—";
  }

  const ageSexEl = modal.querySelector(".age-sex-text");
  if (ageSexEl) {
    const parts = [user.age != null ? `${user.age} y.o.` : null, user.gender].filter(Boolean);
    ageSexEl.textContent = parts.join(", ") || "—";
  }

  const emailEl = modal.querySelector(".email-text");
  if (emailEl) {
    emailEl.innerHTML = user.email
      ? `<a href="mailto:${user.email}">${user.email}</a>`
      : "—";
  }

  const phoneEl = modal.querySelector(".phone-text");
  if (phoneEl) phoneEl.textContent = user.phone || "—";

  const noteEl = modal.querySelector(".teacher-description p");
  if (noteEl) noteEl.textContent = user.note || "";

  window.location.hash = "modal-teacher-info";
}

function setupEventDelegation() {
  const teachersGrid = document.querySelector(".teachers-grid");
  if (teachersGrid) {
    teachersGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".teacher-card");
      if (!card) return;
      e.preventDefault();
      const userId = card.dataset.userId;
      const user = allUsers.find((u) => String(u.id) === String(userId));
      if (user) openTeacherModal(user);
    });
  }

  const favContainer = document.querySelector(".favorites-cards");
  if (favContainer) {
    favContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".favorite-card");
      if (!card) return;
      e.preventDefault();
      const userId = card.dataset.userId;
      const user = allUsers.find((u) => String(u.id) === String(userId));
      if (user) openTeacherModal(user);
    });
  }

  const starEl = document.querySelector("#modal-teacher-info .star-icon");
  if (starEl) {
    starEl.addEventListener("click", () => {
      const modal = document.getElementById("modal-teacher-info");
      const userId = modal ? modal.dataset.currentUserId : null;
      const user = allUsers.find((u) => String(u.id) === String(userId));
      if (user) {
        user.favorite = !user.favorite;
        starEl.textContent = user.favorite ? "⭐" : "☆";
        starEl.title = user.favorite ? "Remove from favorites" : "Add to favorites";
        refreshAll();
      }
    });
  }

  document.querySelectorAll(".modal-close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "";
      history.pushState(null, "", window.location.pathname + window.location.search);
    });
  });
}

function setupFilters() {
  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    const countries = Array.from(
      new Set(allUsers.map((u) => u.country).filter(Boolean))
    ).sort();

    regionSelect.innerHTML = `<option value="all">All regions</option>` +
      countries.map((c) => `<option value="${c}">${c}</option>`).join("");
    regionSelect.addEventListener("change", applyAndRender);
  }

  const ageSelect = document.getElementById("age-select");
  if (ageSelect) {
    ageSelect.innerHTML = `
      <option value="all">All ages</option>
      <option value="18-31">18-31</option>
      <option value="32-45">32-45</option>
      <option value="46-120">46+</option>
    `;
    ageSelect.addEventListener("change", applyAndRender);
  }

  const sexSelect = document.getElementById("sex-select");
  if (sexSelect) {
    sexSelect.innerHTML = `
      <option value="all">All genders</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    `;
    sexSelect.addEventListener("change", applyAndRender);
  }

  const photoCheckbox = document.getElementById("photo-checkbox");
  if (photoCheckbox) {
    photoCheckbox.addEventListener("change", applyAndRender);
  }

  const favCheckbox = document.getElementById("favourites-checkbox");
  if (favCheckbox) {
    favCheckbox.addEventListener("change", applyAndRender);
  }
}

function applyAndRender() {
  currentPage = 1;
  const filtered = getDisplayedUsers();
  renderTeacherCards(filtered);
  renderStatisticsTable(sortUsers(filtered, currentSort.field, currentSort.order));
}

function renderStatisticsTable(users) {
  const tbody = document.querySelector(".statistics-table tbody");
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageUsers = users.slice(start, start + PAGE_SIZE);

  if (pageUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No records</td></tr>`;
    renderPagination(0);
    return;
  }

  tbody.innerHTML = pageUsers
    .map(
      (u) => `
      <tr>
        <td>${u.full_name || "—"}</td>
        <td>${u.course || "—"}</td>
        <td>${u.age != null ? u.age : "—"}</td>
        <td>${u.gender || "—"}</td>
        <td>${u.country || "—"}</td>
      </tr>
    `
    )
    .join("");

  renderPagination(users.length);
}

function renderPagination(total) {
  const nav = document.querySelector(".statistics .pagination");
  if (!nav) return;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  nav.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const a = document.createElement("a");
    a.textContent = i;
    a.href = "#statistics";
    if (i === currentPage) a.classList.add("active");
    a.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      const sorted = sortUsers(getDisplayedUsers(), currentSort.field, currentSort.order);
      renderStatisticsTable(sorted);
    });
    nav.appendChild(a);
  }
}

function setupTableSorting() {
  const headers = document.querySelectorAll(".statistics-table thead th");
  const sortKeys = ["full_name", "course", "age", null, "country"];

  headers.forEach((th, i) => {
    const key = sortKeys[i];
    if (!key) return;

    th.dataset.sort = key;
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      if (currentSort.field === key) {
        currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
      } else {
        currentSort.field = key;
        currentSort.order = "asc";
      }

      headers.forEach((h) => {
        const arrow = h.querySelector(".sort-arrow");
        if (!arrow) return;
        if (h.dataset.sort === currentSort.field) {
          arrow.innerHTML = currentSort.order === "asc" ? "&uarr;" : "&darr;";
          h.classList.add("sort-active");
        } else {
          arrow.innerHTML = "&darr;";
          h.classList.remove("sort-active");
        }
      });

      const sorted = sortUsers(getDisplayedUsers(), currentSort.field, currentSort.order);
      renderStatisticsTable(sorted);
    });
  });
}

function setupSearch() {
  const form = document.querySelector(".search-form");
  const input = document.getElementById("teacher-search");
  if (!form || !input) return;

  const doSearch = () => {
    searchQuery = input.value.trim();
    applyAndRender();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    doSearch();
  });

  input.addEventListener("input", doSearch);
}

function setupAddTeacherForm() {
  const btn = document.querySelector(".btn-submit-add");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearFormErrors();

    const fullNameInput = document.getElementById("input-name");
    const cityInput = document.getElementById("input-city");
    const notesInput = document.getElementById("input-notes");
    const specSelect = document.getElementById("input-speciality");
    const countrySelect = document.getElementById("input-country");
    const emailInput = document.getElementById("input-email");
    const phoneInput = document.getElementById("input-phone");
    const dobInput = document.getElementById("input-dob");
    const colorInput = document.getElementById("input-color");
    const checkedSex = document.querySelector('input[name="modal-sex"]:checked');

    const full_name = fullNameInput ? fullNameInput.value.trim() : "";
    const course = specSelect ? specSelect.value : "Mathematics";
    const country = countrySelect ? countrySelect.value : "Germany";
    const city = cityInput ? cityInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const b_day = dobInput ? dobInput.value : "";
    const gender = checkedSex ? checkedSex.value : "Male";
    const bg_color = colorInput ? colorInput.value : "#ffffff";
    const note = notesInput && notesInput.value.trim() ? notesInput.value.trim() : "Notes";

    let age = null;
    if (b_day) {
      age = new Date().getFullYear() - new Date(b_day).getFullYear();
    }

    const rawUser = {
      full_name,
      course,
      country,
      city,
      state: country,
      email,
      phone,
      b_day,
      age,
      gender,
      bg_color,
      note,
      favorite: false,
    };

    const newUser = formatExtraUser(rawUser);
    const isValid = validateUser(newUser);

    if (!isValid) {
      showFormErrors(newUser);
      return;
    }

    allUsers.unshift(newUser);
    refreshAll();

    const addForm = document.querySelector(".add-teacher-form");
    if (addForm) addForm.reset();

    window.location.hash = "";

    history.pushState(null, "", window.location.pathname + window.location.search);
    const teachersSec = document.getElementById("teachers");
    if (teachersSec) teachersSec.scrollIntoView({ behavior: "smooth" });
  });
}

function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((el) => el.remove());
  document
    .querySelectorAll(".input-invalid")
    .forEach((el) => el.classList.remove("input-invalid"));
}

function showFormErrors(user) {
  const isCap = (str) =>
    typeof str === "string" && str.trim().length > 0 && /^[A-ZА-ЯІЇЄҐ]/.test(str.trim());

  const checks = [
    { id: "input-name", valid: isCap(user.full_name), msg: "Capitalized name required" },
    { id: "input-city", valid: isCap(user.city), msg: "Capitalized city required" },
    { id: "input-email", valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email || ""), msg: "Invalid email" },
    { id: "input-phone", valid: Boolean(user.phone && user.phone.length > 5), msg: "Valid phone required" },
    { id: "input-dob", valid: typeof user.age === "number" && user.age >= 0, msg: "Valid date required" },
  ];

  checks.forEach(({ id, valid, msg }) => {
    if (!valid) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add("input-invalid");
      const err = document.createElement("span");
      err.className = "form-error";
      err.style.color = "red";
      err.style.fontSize = "12px";
      err.textContent = msg;
      el.parentNode.appendChild(err);
    }
  });
}

function renderFavoritesSection() {
  const container = document.querySelector(".favorites-cards");
  if (!container) return;

  const favUsers = allUsers.filter((u) => u.favorite);

  if (favUsers.length === 0) {
    container.innerHTML = `<p class="no-results">No favorites yet. Click ☆ to add.</p>`;
    return;
  }

  container.innerHTML = favUsers
    .map((user, idx) => {
      const avatarHtml = user.picture_thumbnail
        ? `<img src="${user.picture_thumbnail}" alt="${user.full_name || ""}">`
        : `<span>${getInitials(user.full_name)}</span>`;

      const avatarClass = user.picture_thumbnail
        ? "teacher-avatar"
        : "teacher-avatar initials-avatar";

      return `
        <article id="fav-${idx + 1}" class="favorite-card" data-user-id="${user.id}">
          <a href="#modal-teacher-info" class="teacher-card-link">
            <div class="${avatarClass}">${avatarHtml}</div>
            <h3 class="teacher-name">${user.full_name || "Unknown"}</h3>
            <p class="teacher-country">${user.country || "—"}</p>
          </a>
        </article>
      `;
    })
    .join("");
}

function refreshAll() {
  const filtered = getDisplayedUsers();
  renderTeacherCards(filtered);
  renderStatisticsTable(sortUsers(filtered, currentSort.field, currentSort.order));
  renderFavoritesSection();
}

export function initApp() {
  allUsers = formatAndMergeUsers(randomUserMock, additionalUsers);

  setupFilters();
  setupTableSorting();
  setupSearch();
  setupAddTeacherForm();
  setupEventDelegation();

  refreshAll();
}
