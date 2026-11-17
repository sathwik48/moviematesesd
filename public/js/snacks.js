document.addEventListener("DOMContentLoaded", async () => {
  const alertBox = document.getElementById("snacks-alert");
  const listRoot = document.getElementById("snacks-list");
  const summaryRoot = document.getElementById("snack-summary");
  const continueButton = document.getElementById("continue-to-payment");
  let draft;
  let movies = [];
  let cinemas = [];
  let menu = [];
  const selections = new Map();

  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
  }

  function clearError() {
    alertBox.classList.add("hidden");
    alertBox.textContent = "";
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  }

  function renderMenu() {
    const grouped = menu.reduce((accumulator, item) => {
      if (!accumulator[item.category]) accumulator[item.category] = [];
      accumulator[item.category].push(item);
      return accumulator;
    }, {});
    listRoot.innerHTML = Object.entries(grouped).map(([category, items]) => `
      <div class="snack-category">
        <h3>${escapeHtml(category)}</h3>
        <div class="snack-grid">
          ${items.map(item => `
            <article class="snack-item">
              <div>
                <h4>${escapeHtml(item.name)}</h4>
                <p>${money(item.price)}</p>
              </div>
              <div class="quantity-stepper">
                <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease ${escapeHtml(item.name)}">−</button>
                <span>${selections.get(item.id) || 0}</span>
                <button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase ${escapeHtml(item.name)}">+</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    `).join("");

    listRoot.querySelectorAll("button[data-action]").forEach(button => {
      button.addEventListener("click", () => {
        const itemId = button.dataset.id;
        const current = selections.get(itemId) || 0;
        const next = button.dataset.action === "increase" ? current + 1 : Math.max(0, current - 1);
        selections.set(itemId, next);
        renderMenu();
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const movie = movies.find(item => item.id === draft.movieId);
    const cinema = cinemas.find(item => item.id === draft.cinemaId);
    const ticketTotal = (cinema?.price || 0) * (Array.isArray(draft.seats) ? draft.seats.length : 0);
    const foodItems = menu.filter(item => (selections.get(item.id) || 0) > 0).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: selections.get(item.id) || 0
    }));
    const foodTotal = foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    summaryRoot.innerHTML = `
      <div class="payment-summary-card">
        <img src="${escapeHtml(movie?.poster || "")}" alt="${escapeHtml(movie?.title || "Movie")}">
        <div>
          <h3>${escapeHtml(movie?.title || "Select a movie")}</h3>
          <p>${escapeHtml(movie?.genre || "")}${movie?.genre ? " · " : ""}${movie?.duration || ""}${movie?.duration ? " min" : ""}</p>
          <p>${escapeHtml(cinema?.name || "")}</p>
        </div>
      </div>
      <div class="booking-detail-list">
        <div><span>Date</span><strong>${escapeHtml(draft.date ? new Date(`${draft.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—")}</strong></div>
        <div><span>Showtime</span><strong>${escapeHtml(draft.time ? new Date(`2000-01-01T${draft.time}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—")}</strong></div>
        <div><span>Seats</span><strong>${escapeHtml((draft.seats || []).slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(", ") || "Choose seats")}</strong></div>
        <div><span>Tickets</span><strong>${(draft.seats || []).length}</strong></div>
      </div>
      ${foodItems.length ? `<div class="booking-detail-list"><div><span>Food</span><strong>${escapeHtml(foodItems.map(item => `${item.name} x${item.quantity}`).join(", "))}</strong></div><div><span>Snacks total</span><strong>${money(foodTotal)}</strong></div></div>` : ""}
      <div class="summary-total"><span>Total</span><strong>${money(ticketTotal + foodTotal)}</strong></div>
    `;
  }

  try {
    draft = JSON.parse(sessionStorage.getItem("reelTimeDraft") || "null");
    if (!draft || !Array.isArray(draft.seats) || !draft.seats.length) {
      throw new Error("Your booking session is expired. Please choose your seats again.");
    }
    const { user } = await api("/api/auth/me");
    if (!user) {
      window.location.href = `/login.html?next=${encodeURIComponent("/snacks.html")}`;
      return;
    }
    [movies, cinemas, menu] = await Promise.all([api("/api/movies"), api("/api/cinemas"), api("/api/food-items")]);
    menu.forEach(item => selections.set(item.id, 0));
    renderMenu();
    updateSummary();
    continueButton.addEventListener("click", () => {
      const foodItems = menu.filter(item => (selections.get(item.id) || 0) > 0).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: selections.get(item.id) || 0
      }));
      draft.foodItems = foodItems;
      sessionStorage.setItem("reelTimeDraft", JSON.stringify(draft));
      window.location.href = "/payment.html";
    });
  } catch (error) {
    showError(error.message);
    continueButton.disabled = true;
  }
});
