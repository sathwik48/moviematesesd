document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("bookings-list");
  async function render() {
    try {
      const bookings = await api("/api/bookings/mine");
      if (!bookings.length) {
        container.innerHTML = `<div class="empty-panel"><i class="fa-solid fa-ticket"></i><h3>No bookings yet</h3><p>Your next great night out is waiting.</p><a class="btn btn-primary" href="/movies.html">Browse movies</a></div>`;
        return;
      }
      container.innerHTML = bookings.map(booking => `<article class="booking-card"><img src="${escapeHtml(booking.poster)}" alt=""><div><span class="booking-id">${escapeHtml(booking.id)}</span><h3>${escapeHtml(booking.movieTitle)} <span class="status-pill ${booking.status === "cancelled" ? "cancelled" : ""}">${escapeHtml(booking.status)}</span></h3><p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(booking.cinemaName)} · ${escapeHtml(booking.cinemaLocation)}</p><p><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatDate(booking.date))} · ${escapeHtml(formatTime(booking.time))}</p><p><i class="fa-solid fa-couch"></i> Seats ${escapeHtml(booking.seats.join(", "))}</p></div><div class="booking-card-actions"><strong>${money(booking.total)}</strong>${booking.status === "confirmed" ? `<button class="btn btn-ghost btn-small cancel-booking" data-id="${escapeHtml(booking.id)}">Cancel booking</button>` : ""}</div></article>`).join("");
      container.querySelectorAll(".cancel-booking").forEach(button => button.addEventListener("click", async () => {
        if (!window.confirm("Cancel this booking? The seats will become available again.")) return;
        button.disabled = true;
        try { await api(`/api/bookings/${encodeURIComponent(button.dataset.id)}/cancel`, { method: "POST" }); await render(); }
        catch (error) { window.alert(error.message); button.disabled = false; }
      }));
    } catch (error) {
      if (error.status === 401) {
        container.innerHTML = `<div class="empty-panel"><i class="fa-solid fa-user-lock"></i><h3>Sign in to see your tickets</h3><p>Your bookings are private to your account.</p><a class="btn btn-primary" href="/login.html?next=${encodeURIComponent("/mybookings.html")}">Sign in</a></div>`;
      } else {
        container.innerHTML = `<div class="alert">${escapeHtml(error.message)}</div>`;
      }
    }
  }
  await render();
});
