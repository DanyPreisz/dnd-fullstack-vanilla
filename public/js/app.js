import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#campaign-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/campaigns");
  listEl.innerHTML = "";
  data.campaigns.forEach((c) => {
    const box = document.createElement("div");
    box.className = "camp";
    const title = document.createElement("strong");
    title.textContent = c.name;
    box.append(title);
    c.sessions.forEach((s) => {
      const el = document.createElement("div");
      el.className = "session";
      el.textContent = s.note;
      box.append(el);
    });
    const noteForm = document.createElement("form");
    noteForm.className = "form";
    noteForm.innerHTML = `<textarea placeholder="Nota de sesion" maxlength="500"></textarea><button class="primary" type="submit">Agregar</button>`;
    noteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const note = noteForm.querySelector("textarea").value.trim();
      if (!note) return;
      await api(`/api/campaigns/${c.id}/session`, { method: "POST", body: JSON.stringify({ note }) });
      await refresh();
    });
    box.append(noteForm);
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/campaigns/${c.id}`, { method: "DELETE" }); await refresh(); });
    box.append(del);
    listEl.append(box);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/campaigns", { method: "POST", body: JSON.stringify({ name: document.querySelector("#name").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
