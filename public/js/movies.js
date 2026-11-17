document.addEventListener("DOMContentLoaded", async () => {
  const search = document.getElementById("movie-search");
  const genre = document.getElementById("genre-filter");
  const language = document.getElementById("language-filter");
  const release = document.getElementById("release-filter");
  const results = document.getElementById("movies-list");
  const count = document.getElementById("movie-count");
  const empty = document.getElementById("movies-empty");
  let movies = [];

  function render() {
    const term = search.value.trim().toLowerCase();
    const filtered = movies.filter(movie =>
      (!term || `${movie.title} ${movie.genre || ""} ${movie.language} ${movie.description}`.toLowerCase().includes(term)) &&
      (!genre.value || movie.genre === genre.value) &&
      (!language.value || movie.language === language.value) &&
      (!release.value || movie.releaseType === release.value)
    );
    results.innerHTML = filtered.map(movieCard).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "movie" : "movies"} found`;
    empty.classList.toggle("hidden", filtered.length > 0);
  }

  try {
    movies = await api("/api/movies");
    [...new Set(movies.map(movie => movie.genre).filter(Boolean))].sort().forEach(value => genre.add(new Option(value, value)));
    [...new Set(movies.map(movie => movie.language))].sort().forEach(value => language.add(new Option(value, value)));
    [search, genre, language, release].forEach(element => element.addEventListener("input", render));
    render();
    const targetId = decodeURIComponent(location.hash.slice(1));
    if (targetId) requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ block: "start" }));
  } catch (error) {
    results.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
});
