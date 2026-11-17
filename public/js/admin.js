document.addEventListener("DOMContentLoaded", () => {
  const loginPanel = document.getElementById("admin-login");
  const dashboard = document.getElementById("admin-dashboard");
  const alertBox = document.getElementById("admin-alert");
  const loginForm = document.getElementById("admin-login-form");
  const movieForm = document.getElementById("admin-movie-form");
  const movieList = document.getElementById("admin-movies");
  const bookingList = document.getElementById("admin-bookings");
  let movies = [];

  function message(text, isError = true) {
    alertBox.textContent = text;
    alertBox.classList.remove("hidden");
    if (!isError) alertBox.style.borderColor = "rgba(46,184,121,.4)";
  }
  function clearMessage() {
    alertBox.classList.add("hidden");
    alertBox.style.borderColor = "";
  }
  function resetForm() {
    movieForm.reset();
    movieForm.elements.id.value = "";
    document.getElementById("movie-form-title").textContent = "Add a movie";
    document.getElementById("cancel-edit").classList.add("hidden");
  }

  async function loadDashboard() {
    try {
      const userResponse = await api("/api/auth/me");
      if (!userResponse.user || userResponse.user.role !== "admin") {
        loginPanel.classList.remove("hidden");
        dashboard.classList.add("hidden");
        return;
      }
      loginPanel.classList.add("hidden");
      dashboard.classList.remove("hidden");
      const [movieResults, bookings] = await Promise.all([api("/api/movies"), api("/api/admin/bookings")]);
      movies = movieResults;
      movieList.innerHTML = movies.map(movie => `<article class="admin-movie-row"><img src="${escapeHtml(movie.poster)}" alt=""><div><h3>${escapeHtml(movie.title)}</h3><p>${escapeHtml(movie.genre || "Genre not listed")} · ${escapeHtml(movie.language)} · ${escapeHtml(movie.city || "All cities")} · ${escapeHtml(movie.releaseType === "now" ? "Now showing" : "Coming soon")}</p></div><div class="row-actions"><button class="btn btn-ghost btn-small edit-movie" data-id="${escapeHtml(movie.id)}">Edit</button><button class="btn btn-ghost btn-small delete-movie" data-id="${escapeHtml(movie.id)}" aria-label="Delete ${escapeHtml(movie.title)}"><i class="fa-solid fa-trash"></i></button></div></article>`).join("");
      bookingList.innerHTML = bookings.length ? `<table><thead><tr><th>Booking</th><th>Customer</th><th>Movie</th><th>Show</th><th>Seats</th><th>Total</th><th>Status</th></tr></thead><tbody>${bookings.map(booking => `<tr><td>${escapeHtml(booking.id)}</td><td>${escapeHtml(booking.userName || booking.userId.slice(0, 8))}</td><td>${escapeHtml(booking.movieTitle)}</td><td>${escapeHtml(formatDate(booking.date, { month: "short", day: "numeric" }))} · ${escapeHtml(formatTime(booking.time))}</td><td>${escapeHtml(booking.seats.join(", "))}</td><td>${money(booking.total)}</td><td><span class="status-pill ${booking.status === "cancelled" ? "cancelled" : ""}">${escapeHtml(booking.status)}</span></td></tr>`).join("")}</tbody></table>` : `<div class="empty-panel"><i class="fa-solid fa-ticket"></i><h3>No bookings yet</h3><p>Customer bookings will appear here.</p></div>`;
      movieList.querySelectorAll(".edit-movie").forEach(button => button.addEventListener("click", () => {
        const movie = movies.find(item => item.id === button.dataset.id);
        if (!movie) return;
        Object.entries(movie).forEach(([key, value]) => { if (movieForm.elements[key]) movieForm.elements[key].value = value; });
        document.getElementById("movie-form-title").textContent = "Edit movie";
        document.getElementById("cancel-edit").classList.remove("hidden");
        movieForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }));
      movieList.querySelectorAll(".delete-movie").forEach(button => button.addEventListener("click", async () => {
        const movie = movies.find(item => item.id === button.dataset.id);
        if (!movie || !window.confirm(`Delete “${movie.title}” from the catalogue?`)) return;
        try { await api(`/api/admin/movies/${encodeURIComponent(movie.id)}`, { method: "DELETE" }); await loadDashboard(); message("Movie deleted.", false); }
        catch (error) { message(error.message); }
      }));
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        loginPanel.classList.remove("hidden");
        dashboard.classList.add("hidden");
      } else message(error.message);
    }
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();
    try {
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
      if (result.user.role !== "admin") {
        await api("/api/auth/logout", { method: "POST" });
        throw new Error("This account does not have administrator access.");
      }
      await loadDashboard();
    } catch (error) { message(error.message); }
  });
  movieForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();
    const data = Object.fromEntries(new FormData(movieForm));
    const id = data.id;
    delete data.id;
    try {
      await api(id ? `/api/admin/movies/${encodeURIComponent(id)}` : "/api/admin/movies", {
        method: id ? "PUT" : "POST", body: JSON.stringify(data)
      });
      resetForm();
      await loadDashboard();
      message(id ? "Movie updated." : "Movie added.", false);
    } catch (error) { message(error.message); }
  });
  document.getElementById("cancel-edit").addEventListener("click", resetForm);
  loadDashboard();
});
