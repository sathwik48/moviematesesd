document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const form = loginForm || registerForm;
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = form.querySelector(".form-message");
    const button = form.querySelector("button[type=submit]");
    message.textContent = "";
    button.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      const endpoint = loginForm ? "/api/auth/login" : "/api/auth/register";
      await api(endpoint, { method: "POST", body: JSON.stringify(body) });
      const next = new URLSearchParams(location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/movies.html";
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
});
