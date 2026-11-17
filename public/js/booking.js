document.addEventListener("DOMContentLoaded", async () => {
  const movieSelect = document.getElementById("movie-select");
  const citySelect = document.getElementById("city-select");
  const cinemaSelect = document.getElementById("cinema-select");
  const dateSelect = document.getElementById("date-select");
  const timeSelect = document.getElementById("time-select");
  const seatMap = document.getElementById("seat-map");
  const alertBox = document.getElementById("booking-alert");
  const continueButton = document.getElementById("continue-booking");
  const selectedSeats = new Set();
  let movies = [];
  let cinemas = [];
  let bookedSeats = [];

  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
  }
  function clearError() { alertBox.classList.add("hidden"); alertBox.textContent = ""; }
  function updateSummary() {
    const movie = movies.find(item => item.id === movieSelect.value);
    const cinema = cinemas.find(item => item.id === cinemaSelect.value);
    const summaryMovie = document.getElementById("summary-movie");
    if (movie) {
      const details = [movie.genre, movie.duration == null ? "" : `${movie.duration} min`, movie.language].filter(Boolean).join(" · ");
      summaryMovie.innerHTML = `<div class="summary-poster"><img src="${escapeHtml(movie.poster)}" alt=""></div><div><h3>${escapeHtml(movie.title)}</h3><p>${escapeHtml(details)}</p></div>`;
    } else {
      summaryMovie.innerHTML = `<div class="summary-poster"><i class="fa-solid fa-film"></i></div><div><h3>Select a movie</h3><p>Movie details appear here</p></div>`;
    }
    document.getElementById("summary-cinema").textContent = cinema ? `${cinema.name} · ${cinema.city}` : "—";
    const date = dateSelect.value ? formatDate(dateSelect.value, { month: "short", day: "numeric", year: "numeric" }) : "";
    const time = timeSelect.value ? formatTime(timeSelect.value) : "";
    document.getElementById("summary-date").textContent = date ? `${date}${time ? ` · ${time}` : ""}` : "—";
    document.getElementById("summary-seats").textContent = selectedSeats.size ? [...selectedSeats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(", ") : "Choose seats";
    document.getElementById("summary-total").textContent = money((cinema?.price || 0) * selectedSeats.size);
    continueButton.disabled = !movie || !cinema || !dateSelect.value || !timeSelect.value || selectedSeats.size === 0;
  }

  async function loadSeats() {
    selectedSeats.clear();
    clearError();
    updateSummary();
    if (!movieSelect.value || !cinemaSelect.value || !dateSelect.value || !timeSelect.value) {
      seatMap.innerHTML = `<p class="seat-placeholder">Choose a movie, cinema, date and time to see available seats.</p>`;
      return;
    }
    seatMap.innerHTML = `<p class="seat-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading seats…</p>`;
    try {
      const query = new URLSearchParams({ movieId: movieSelect.value, cinemaId: cinemaSelect.value, date: dateSelect.value, time: timeSelect.value });
      ({ bookedSeats } = await api(`/api/availability?${query}`));
      renderSeats();
    } catch (error) {
      seatMap.innerHTML = `<p class="seat-placeholder">${escapeHtml(error.message)}</p>`;
    }
  }

  function renderSeats() {
    const rows = "ABCDEFGH".split("");
    seatMap.innerHTML = rows.map(row => `<div class="seat-row"><span class="row-label">${row}</span>${Array.from({ length: 10 }, (_, index) => {
      const seatId = `${row}${index + 1}`;
      const booked = bookedSeats.includes(seatId);
      const selected = selectedSeats.has(seatId);
      return `${index === 5 ? '<span class="seat-gap"></span>' : ""}<button class="seat${booked ? " booked" : ""}${selected ? " selected" : ""}" type="button" aria-label="Seat ${seatId}${booked ? ", booked" : selected ? ", selected" : ", available"}" data-seat="${seatId}" ${booked ? "disabled" : ""}>${index + 1}</button>`;
    }).join("")}</div>`).join("");
    seatMap.querySelectorAll(".seat:not(.booked)").forEach(button => button.addEventListener("click", () => {
      const seat = button.dataset.seat;
      if (selectedSeats.has(seat)) selectedSeats.delete(seat);
      else if (selectedSeats.size < 8) selectedSeats.add(seat);
      else { showError("You can select up to 8 seats per booking."); return; }
      clearError();
      renderSeats();
      updateSummary();
    }));
  }

  function refreshCinemaOptions() {
    const cityValue = citySelect.value;
    const filtered = cityValue ? cinemas.filter(cinema => cinema.city === cityValue) : cinemas;
    cinemaSelect.innerHTML = '<option value="">Choose a cinema</option>' + filtered.map(cinema => `<option value="${cinema.id}">${cinema.name} · ${cinema.city} (${money(cinema.price)}/seat)</option>`).join("");
    if (cinemaSelect.dataset.value && filtered.some(cinema => cinema.id === cinemaSelect.dataset.value)) {
      cinemaSelect.value = cinemaSelect.dataset.value;
      delete cinemaSelect.dataset.value;
    }
  }

  function syncMovieCity() {
    const movie = movies.find(item => item.id === movieSelect.value);
    citySelect.disabled = Boolean(movie && movie.city);
    citySelect.value = movie && movie.city ? movie.city : "";
    refreshCinemaOptions();
  }

  try {
    const [movieResults, cityResults, cinemaResults, times] = await Promise.all([
      api("/api/movies?releaseType=now"), api("/api/cities"), api("/api/cinemas"), api("/api/showtimes")
    ]);
    movies = movieResults;
    cinemas = cinemaResults;
    movies.forEach(movie => movieSelect.add(new Option(`${movie.title} · ${movie.language}`, movie.id)));
    cityResults.forEach(city => citySelect.add(new Option(city, city)));
    refreshCinemaOptions();
    times.forEach(time => timeSelect.add(new Option(formatTime(time), time)));
    const today = new Date();
    dateSelect.min = today.toISOString().slice(0, 10);
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() + 60);
    dateSelect.max = lastDate.toISOString().slice(0, 10);
    dateSelect.value = dateSelect.min;
    const movieFromUrl = new URLSearchParams(location.search).get("movie");
    if (movies.some(movie => movie.id === movieFromUrl)) {
      movieSelect.value = movieFromUrl;
      syncMovieCity();
    }
    movieSelect.addEventListener("change", () => { syncMovieCity(); loadSeats(); });
    [citySelect, dateSelect, timeSelect].forEach(element => element.addEventListener("change", loadSeats));
    citySelect.addEventListener("change", () => {
      cinemaSelect.value = "";
      refreshCinemaOptions();
      loadSeats();
    });
    cinemaSelect.addEventListener("change", loadSeats);
    continueButton.addEventListener("click", async () => {
      const { user } = await api("/api/auth/me");
      if (!user) {
        window.location.href = `/login.html?next=${encodeURIComponent("/snacks.html")}`;
        return;
      }
      const draft = {
        movieId: movieSelect.value,
        city: citySelect.value,
        cinemaId: cinemaSelect.value,
        date: dateSelect.value,
        time: timeSelect.value,
        seats: [...selectedSeats]
      };
      sessionStorage.setItem("reelTimeDraft", JSON.stringify(draft));
      window.location.href = "/snacks.html";
    });
    updateSummary();
    if (movieSelect.value) loadSeats();
  } catch (error) {
    showError(error.message);
  }
});
