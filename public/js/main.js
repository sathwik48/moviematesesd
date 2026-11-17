async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(value, options = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options);
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function movieCard(movie) {
  const bookButton = movie.releaseType === "now"
    ? `<a class="btn btn-primary" href="/booking.html?movie=${encodeURIComponent(movie.id)}">Book tickets <i class="fa-solid fa-arrow-right"></i></a>`
    : `<span class="coming-soon"><i class="fa-regular fa-clock"></i> COMING SOON</span>`;
  const rating = movie.rating == null ? "" : `<span class="movie-rating"><i class="fa-solid fa-star"></i> ${escapeHtml(movie.rating)}</span>`;
  const metadata = [
    movie.genre ? `<span class="genre-chip">${escapeHtml(movie.genre)}</span>` : "",
    movie.language ? `<span>${escapeHtml(movie.language)}</span>` : "",
    movie.duration == null ? "" : `<span>${escapeHtml(movie.duration)}m</span>`
  ].filter(Boolean).join('<span class="divider">·</span>');
  return `<article id="movie-${escapeHtml(movie.id)}" class="movie-card">
    <div class="movie-poster"><img src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)} poster artwork" loading="lazy"><div class="poster-fade"></div>${rating}</div>
    <div class="movie-body"><h3 title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3><div class="movie-meta${metadata ? "" : " hidden"}">${metadata}</div><p class="movie-description">${escapeHtml(movie.description)}</p>${bookButton}</div>
  </article>`;
}

function setupHomeCarousel(movies) {
  const details = document.getElementById("home-feature-details");
  const feature = document.querySelector(".hero-content");
  const poster = document.getElementById("home-feature-poster");
  const title = document.getElementById("featured-movie-title");
  const tagline = document.getElementById("featured-movie-tagline");
  const rating = document.getElementById("featured-movie-rating");
  const ratingValue = rating?.querySelector("strong");
  const genre = document.getElementById("featured-movie-genre");
  const language = document.getElementById("featured-movie-language");
  const duration = document.getElementById("featured-movie-duration");
  const releaseDate = document.getElementById("featured-movie-release-date");
  const description = document.getElementById("featured-movie-description");
  const status = document.getElementById("featured-movie-status");
  const image = document.getElementById("featured-movie-poster");
  const bookingLink = document.getElementById("featured-movie-booking");
  const detailsLink = document.getElementById("featured-movie-details");
  const previousButton = document.getElementById("featured-previous");
  const nextButton = document.getElementById("featured-next");
  const dots = document.getElementById("featured-dots");
  if (!details || !feature || !poster || !title || !tagline || !ratingValue || !genre || !language ||
    !duration || !releaseDate || !description || !status || !image || !bookingLink || !detailsLink ||
    !previousButton || !nextButton || !dots) return;

  const nowShowing = movies.filter(movie => movie.releaseType === "now");
  const featuredOrder = ["ramayana", "dnk", "jayannth-jingo-pen", "chandrayan", "scene"];
  const moviesById = new Map(nowShowing.map(movie => [movie.id, movie]));
  const prioritizedMovies = featuredOrder.map(id => moviesById.get(id)).filter(Boolean);
  const prioritizedIds = new Set(featuredOrder);
  const currentMovies = [...prioritizedMovies, ...nowShowing.filter(movie => !prioritizedIds.has(movie.id))];
  if (currentMovies.length === 0) return;

  function valueOrUnavailable(value) {
    if (value == null || String(value).trim() === "") return "Not Available";
    return String(value);
  }

  function renderMovie(movie, index) {
    const bookingUrl = `/booking.html?movie=${encodeURIComponent(movie.id)}`;
    title.textContent = movie.title;
    tagline.textContent = valueOrUnavailable(movie.tagline);
    ratingValue.textContent = valueOrUnavailable(movie.rating);
    genre.textContent = valueOrUnavailable(movie.genre);
    language.textContent = valueOrUnavailable(movie.language);
    duration.textContent = movie.duration == null || String(movie.duration).trim() === ""
      ? "Not Available"
      : `${movie.duration} min`;
    releaseDate.textContent = valueOrUnavailable(movie.releaseDate);
    const synopsis = typeof movie.description === "string" ? movie.description.trim() : "";
    description.textContent = synopsis && !/^Currently listed in\s/i.test(synopsis)
      ? synopsis
      : "Not Available";
    status.textContent = movie.releaseType === "now" ? "Now Showing" : "Upcoming";
    bookingLink.href = bookingUrl;
    detailsLink.href = `/movies.html#movie-${encodeURIComponent(movie.id)}`;
    poster.href = bookingUrl;
    poster.setAttribute("aria-label", `Book tickets for ${movie.title}`);
    image.src = movie.poster;
    image.alt = `${movie.title} poster`;
    dots.querySelectorAll(".featured-dot").forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", String(dotIndex === index));
    });
  }

  dots.innerHTML = currentMovies.map((movie, index) => `
    <button class="featured-dot" type="button" data-index="${index}" aria-label="Show ${escapeHtml(movie.title)}" aria-current="${index === 0}"></button>
  `).join("");
  renderMovie(currentMovies[0], 0);

  const pauseReasons = new Set();
  let timer;
  let currentIndex = 0;
  let transitioning = false;
  const interval = 5500;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionDuration = reduceMotion ? 0 : 280;

  function scheduleNext() {
    window.clearTimeout(timer);
    if (currentMovies.length > 1 && !reduceMotion && pauseReasons.size === 0) {
      timer = window.setTimeout(() => showMovie(currentIndex + 1), interval);
    }
  }

  function showMovie(index) {
    if (transitioning || currentMovies.length < 2) return;
    const nextIndex = (index + currentMovies.length) % currentMovies.length;
    if (nextIndex === currentIndex) return;
    window.clearTimeout(timer);
    transitioning = true;
    details.classList.add("is-transitioning");
    poster.classList.add("is-transitioning");
    window.setTimeout(() => {
      currentIndex = nextIndex;
      renderMovie(currentMovies[currentIndex], currentIndex);
      details.classList.remove("is-transitioning");
      poster.classList.remove("is-transitioning");
      transitioning = false;
      scheduleNext();
    }, transitionDuration);
  }

  function pause(reason) {
    pauseReasons.add(reason);
    window.clearTimeout(timer);
  }

  function resume(reason) {
    pauseReasons.delete(reason);
    scheduleNext();
  }

  feature.addEventListener("mouseenter", () => pause("hover"));
  feature.addEventListener("mouseleave", () => resume("hover"));
  feature.addEventListener("focusin", () => pause("focus"));
  feature.addEventListener("focusout", event => {
    if (!feature.contains(event.relatedTarget)) resume("focus");
  });
  previousButton.addEventListener("click", () => showMovie(currentIndex - 1));
  nextButton.addEventListener("click", () => showMovie(currentIndex + 1));
  dots.addEventListener("click", event => {
    const button = event.target.closest(".featured-dot");
    if (button) showMovie(Number(button.dataset.index));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause("hidden");
    else resume("hidden");
  });
  scheduleNext();
}

async function loadHomeMovies() {
  const nowContainer = document.getElementById("home-now");
  const upcomingContainer = document.getElementById("home-upcoming");
  if (!nowContainer || !upcomingContainer) return;
  try {
    const movies = await api("/api/movies");
    setupHomeCarousel(movies);
    nowContainer.innerHTML = movies.filter(movie => movie.releaseType === "now").slice(0, 5).map(movieCard).join("");
    const upcoming = movies.filter(movie => movie.releaseType === "upcoming");
    upcomingContainer.innerHTML = upcoming.map(movieCard).join("");
    document.querySelector(".upcoming-section")?.classList.toggle("hidden", upcoming.length === 0);
  } catch (error) {
    nowContainer.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".brand").forEach(brand => {
    brand.innerHTML = '<span class="brand-mark"><i class="fa-solid fa-ticket"></i></span><span>MOVIEMATE</span>';
  });
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  menuButton?.addEventListener("click", () => nav?.classList.toggle("open"));
  try {
    const { user } = await api("/api/auth/me");
    if (user) {
      document.querySelectorAll(".auth-links").forEach(element => element.classList.add("hidden"));
      document.querySelectorAll(".user-links").forEach(element => element.classList.remove("hidden"));
      document.querySelectorAll(".user-greeting").forEach(element => { element.textContent = `Hi, ${user.name}`; });
      if (user.role === "admin") document.querySelectorAll(".admin-link").forEach(element => element.classList.remove("hidden"));
    }
  } catch (error) {
    console.error("Could not load the current user:", error);
  }
  document.querySelectorAll(".logout-button").forEach(button => button.addEventListener("click", async () => {
    try { await api("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }
    catch (error) { window.alert(error.message); }
  }));
});
