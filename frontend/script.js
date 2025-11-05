// =======================================================
// FRONTEND PRINCIPAL - Proyecto Pokémon con FastAPI
// =======================================================

// --- CONFIGURACIÓN BASE ---
const API_BASE =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  "http://localhost:8000";

// --- TOKEN HELPERS ---
function saveToken(t) {
  localStorage.setItem("token", t);
}
function getToken() {
  return localStorage.getItem("token");
}
function logoutLocal() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "login.html";
}

// Redirigir al login si no hay sesión activa
if (window.location.pathname.endsWith("/") || window.location.pathname.endsWith("/index.html")) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}


// =======================================================
// LOGIN Y REGISTRO
// =======================================================
window.addEventListener("load", () => {
  console.log("JS cargado correctamente");

  // --- LOGIN ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    console.log("Formulario de login detectado");
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!username || !password) {
        alert("Por favor, ingresa usuario y contraseña");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, email: "" }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.detail || "Usuario o contraseña incorrectos");
          return;
        }

        const data = await res.json();
        saveToken(data.access_token);
        localStorage.setItem("user_id", data.user_id);

        alert("Inicio de sesión exitoso");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor");
      }
    });
  }

  // --- REGISTRO ---
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    console.log("Formulario de registro detectado");
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!username || !email || !password) {
        alert("Por favor, completa todos los campos");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.detail || "Error al registrar usuario");
          return;
        }

        alert("Usuario registrado correctamente");
        window.location.href = "login.html";
      } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error de conexión con el servidor");
      }
    });
  }

  // --- LOGOUT ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutLocal);
  }

  // --- PÁGINA PRINCIPAL (index.html) ---
  if (window.location.pathname.includes("index.html")) {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    const info = document.getElementById("pokemonInfo");
    const userId = localStorage.getItem("user_id");

    if (!getToken()) {
      window.location.href = "login.html";
      return;
    }

    // BÚSQUEDA DE POKÉMON Y REGISTRO EN HISTORIAL
    if (searchBtn) {
      searchBtn.addEventListener("click", async () => {
        const name = searchInput.value.toLowerCase();
        const token = getToken();

        if (name.trim() === "") {
          info.innerHTML = "<p>Por favor, escribe un nombre.</p>";
          return;
        }

        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
          if (!res.ok) throw new Error("Pokémon no encontrado");

          const data = await res.json();

          info.innerHTML = `
            <h3>${data.name.toUpperCase()}</h3>
            <img src="${data.sprites.front_default}" alt="${data.name}">
            <p><b>Tipo:</b> ${data.types.map((t) => t.type.name).join(", ")}</p>
            <p><b>Altura:</b> ${data.height}</p>
            <p><b>Peso:</b> ${data.weight}</p>
          `;

          // Registrar búsqueda en historial
          const saveRes = await fetch(`${API_BASE}/search-history/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              pokemon_name: data.name,
              pokemon_id: data.id,
            }),
          });

          if (saveRes.ok) {
            console.log("Historial guardado correctamente");
            renderCards([{ name: data.name, id: data.id }]);
          } else {
            const errText = await saveRes.text();
            console.warn("No se pudo guardar el historial:", errText);
          }
        } catch (error) {
          info.innerHTML = "<p>Pokémon no encontrado</p>";
          console.error(error);
        }
      });
    }

    // CARGAR HISTORIAL AUTOMÁTICAMENTE
    loadHistory(userId);
  }
});

// =======================================================
// HISTORIAL DE BÚSQUEDAS
// =======================================================
async function loadHistory(userId, page = 1, size = 8) {
  const token = getToken();
  const container = document.getElementById("cards-container");
  if (!container) {
    console.warn("No existe el contenedor de historial (cards-container)");
    return;
  }

  container.innerHTML = "<p>Cargando historial...</p>";

  try {
    const res = await fetch(`${API_BASE}/users/${userId}/searches?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Error al obtener historial:", err);
      container.innerHTML = "<p>No se pudo cargar el historial.</p>";
      return;
    }

    const items = await res.json();
    console.log("Historial recibido:", items);

    if (Array.isArray(items) && items.length > 0) {
      container.innerHTML = "";
      renderCards(items.map((it) => ({ name: it.pokemon_name, id: it.pokemon_id })));
    } else {
      container.innerHTML = "<p>No hay búsquedas registradas.</p>";
    }
  } catch (err) {
    console.error("Error cargando historial:", err);
    container.innerHTML = "<p>Error al conectar con el servidor.</p>";
  }
}


// =======================================================
// TARJETAS DE POKÉMON
// =======================================================
function createPokemonCard(pokemon) {
  const div = document.createElement("div");
  div.className = "card";
  const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  div.innerHTML = `
    <img src="${img}" alt="${pokemon.name}">
    <div class="name">${pokemon.name}</div>
    <div class="id">#${pokemon.id}</div>
  `;
  return div;
}

async function renderCards(pokemons) {
  const container = document.getElementById("cards-container");
  if (!container) return;

  for (const p of pokemons) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.name}`);
      if (!res.ok) throw new Error("No se encontró el Pokémon");

      const data = await res.json();
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <h3>${data.name.toUpperCase()}</h3>
        <img src="${data.sprites.front_default}" alt="${data.name}">
        <p><b>Tipo:</b> ${data.types.map((t) => t.type.name).join(", ")}</p>
        <p><b>Altura:</b> ${data.height}</p>
        <p><b>Peso:</b> ${data.weight}</p>
      `;

      container.prepend(div); // agrega arriba el nuevo Pokémon
    } catch (error) {
      console.error("Error cargando info del historial:", error);
    }
  }
}



