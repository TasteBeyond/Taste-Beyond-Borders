/* ------------------------------------------------------------
   1. DISH ROTATOR
   ------------------------------------------------------------ */
const dishes = [
  { main: "philippine.jpg",                               name: "Chicken Adobo", country: "Philippines" },
  { main: "sushi.png",                                    name: "Sushi",         country: "Japan" },
  { main: "tacos.jfif",                                   name: "Tacos",         country: "Mexico" },
  { main: "pizza.jfif",                                   name: "Pizza",         country: "Italy" },
  { main: "Adobong-Baboy-Filipino-Pork-Adobo-3-of-4.jpg", name: "Pork Adobo",    country: "Philippines" }
];

let currentDish = 0;

function rotateDish(direction){
  currentDish = (currentDish + direction + dishes.length) % dishes.length;
  updateDish();
}

function updateDish(){
  const dish = dishes[currentDish];
  const mainImg = document.querySelector('.dish-main img');
  const nameEl  = document.querySelector('.dish-name');
  const metaEl  = document.querySelector('.dish-meta');

  if (mainImg) mainImg.src = dish.main;
  if (nameEl)  nameEl.textContent = dish.name;
  if (metaEl)  metaEl.innerHTML = `📍 ${dish.country} &nbsp;|&nbsp; ⭐ 4.9`;

  document.querySelectorAll('.dish-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentDish);
  });
}

window.rotateDish = rotateDish;
window.updateDish = updateDish;


/* ------------------------------------------------------------
   2. SEARCH
   ------------------------------------------------------------ */
const RECIPE_MAP = {
  "adobo":         "recipe-adobo.html",
  "bicol express": "recipe-bicolexpress.html",
  "halo halo":     "recipehalohalo.html",
  "halo-halo":     "recipehalohalo.html",

  "sushi":         "sushi.html",
  "ramen":         "ramen.html",
  "takoyaki":      "takoyaki.html",

  "tacos":         "tacos.html",
  "carnitas":      "carnitas.html",
  "quesadilla":    "quesadilla.html",
  "quasadilla":    "quesadilla.html",

  "pizza":         "pizza.html",
  "lasagna":       "lasagna.html",
  "tiramisu":      "tiramisu.html"
};

function openSearch(){
  const box   = document.getElementById("searchBox");
  const input = document.getElementById("searchInput");
  if (box) box.classList.add("show");
  if (input) input.focus();
}

function closeSearch(){
  const box = document.getElementById("searchBox");
  if (box) box.classList.remove("show");
}

function toggleSearch(){
  const box = document.getElementById("searchBox");
  if (!box) return;
  box.classList.toggle("show");
  if (box.classList.contains("show")) {
    document.getElementById("searchInput")?.focus();
  }
}

function searchRecipe(){
  const input = document.getElementById("searchInput");
  if (!input) return;

  const query = input.value.trim().toLowerCase();
  if (!query) return;

  const target = RECIPE_MAP[query];
  if (target) {
    window.location.href = target;
  } else {
    alert("Recipe not found. Try searching for Adobo, Sushi, Tacos, Pizza, etc.");
  }
}

window.openSearch   = openSearch;
window.closeSearch  = closeSearch;
window.toggleSearch = toggleSearch;
window.searchRecipe = searchRecipe;


/* ------------------------------------------------------------
   3. SIDEBAR
   ------------------------------------------------------------ */
function toggleSidebar(){
  const sidebar = document.getElementById("sidebarRight");
  const overlay = document.getElementById("sidebarOverlay");
  const blur    = document.querySelector(".page-blur");

  if (sidebar) sidebar.classList.toggle("open");
  if (overlay) overlay.classList.toggle("show");
  if (blur)    blur.classList.toggle("active");
}

window.toggleSidebar = toggleSidebar;


/* ------------------------------------------------------------
   4. MUSIC
   ------------------------------------------------------------ */
function toggleMusic(){
  const music = document.getElementById("bgMusic");
  const btn   = document.querySelector(".music-toggle");
  if (!music || !btn) return;

  if (music.paused) {
    music.play().catch(() => {});
    btn.textContent = "🔊";
  } else {
    music.pause();
    btn.textContent = "🔇";
  }
}

window.toggleMusic = toggleMusic;


/* ------------------------------------------------------------
   5. THANK YOU OVERLAY
   ------------------------------------------------------------ */
function closeThankYou(){
  const overlay = document.getElementById("thankYouOverlay");
  if (overlay) overlay.classList.remove("active");
}

window.closeThankYou = closeThankYou;


/* ------------------------------------------------------------
   6. FIREBASE READY HELPER
   ------------------------------------------------------------ */
function onFirebaseReady(callback){
  if (window.db) {
    callback();
  } else {
    document.addEventListener("firebaseReady", callback, { once: true });
  }
}

window.onFirebaseReady = onFirebaseReady;


/* ------------------------------------------------------------
   7. SUGGESTION FORM
   ------------------------------------------------------------ */
onFirebaseReady(function(){

  const form = document.getElementById("suggestionForm");
  if (!form) return;

  const { collection, addDoc } = window.dbFns || {};
  if (!collection || !addDoc) return;

  const suggestionsRef = collection(window.db, "suggestions");
  let sending = false;

  form.addEventListener("submit", async function(e){
    e.preventDefault();
    if (sending) return;
    sending = true;

    const nameInput = document.getElementById("suggestName");
    const textInput = document.getElementById("suggestText");
    const name = (nameInput?.value || "").trim() || "Anonymous";
    const text = (textInput?.value || "").trim();

    if (!text) { sending = false; return; }

    try {
      await addDoc(suggestionsRef, { name, text, createdAt: Date.now() });
      form.reset();

      const overlay = document.getElementById("thankYouOverlay");
      if (overlay) overlay.classList.add("active");
    } catch (err) {
      console.error("Suggestion submit failed:", err);
    } finally {
      setTimeout(() => { sending = false; }, 800);
    }
  });

});


/* ------------------------------------------------------------
   8. COMMENTS
   ------------------------------------------------------------ */
(function initComments(){

  if (window.__commentsInitialized) return;
  window.__commentsInitialized = true;

  onFirebaseReady(function(){

    const form = document.getElementById("commentForm");
    const list = document.getElementById("commentList");
    if (!form || !list) return;

    const { collection, addDoc, getDocs, query, orderBy } = window.dbFns || {};
    if (!collection || !addDoc || !getDocs) return;

    const pageId      = window.location.pathname.replace(/\W/g, "_");
    const commentsRef = collection(window.db, "comments_" + pageId);

    let isSubmitting = false;

    function renderComment(data){
      const div = document.createElement("div");
      div.className = "comment-item";

      const nameEl = document.createElement("strong");
      nameEl.textContent = data.name || "Anonymous";

      const textEl = document.createElement("p");
      textEl.textContent = data.text || "";

      div.appendChild(nameEl);
      div.appendChild(textEl);
      return div;
    }

    async function loadComments(){
      list.innerHTML = "Loading…";
      try {
        const q        = query(commentsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        list.innerHTML = "";

        if (snapshot.empty){
          list.innerHTML = "<p>No comments yet. Be the first!</p>";
          return;
        }

        snapshot.forEach(doc => {
          list.appendChild(renderComment(doc.data()));
        });
      } catch (err){
        console.error("Comments load failed:", err);
        list.innerHTML = "<p>Could not load comments.</p>";
      }
    }

    form.addEventListener("submit", async function(e){
      e.preventDefault();
      e.stopPropagation();

      if (isSubmitting) return;
      isSubmitting = true;

      const nameInput = document.getElementById("commentName");
      const textInput = document.getElementById("commentText");
      const name = (nameInput?.value || "").trim() || "Anonymous";
      const text = (textInput?.value || "").trim();

      if (!text){
        isSubmitting = false;
        return;
      }

      try {
        await addDoc(commentsRef, { name, text, createdAt: Date.now() });
        form.reset();
        await loadComments();
      } catch (err){
        console.error("Comment submit failed:", err);
      } finally {
        setTimeout(() => { isSubmitting = false; }, 800);
      }
    });

    loadComments();

  });

})();


/* ------------------------------------------------------------
   9. RATINGS
   ------------------------------------------------------------ */
(function initRatings(){

  if (window.__ratingsInitialized) return;
  window.__ratingsInitialized = true;

  onFirebaseReady(function(){

    const starContainer = document.getElementById("starRating");
    if (!starContainer) return;

    const stars   = starContainer.querySelectorAll(".star");
    const summary = document.getElementById("ratingSummary");
    const { collection, addDoc, getDocs } = window.dbFns || {};
    if (!collection || !addDoc || !getDocs) return;

    const pageId     = window.location.pathname.replace(/\W/g, "_");
    const ratingsRef = collection(window.db, "ratings_" + pageId);

    let submitting = false;

    async function updateSummary(){
      if (!summary) return;
      try {
        const snapshot = await getDocs(ratingsRef);
        const values   = [];
        snapshot.forEach(doc => values.push(doc.data().value));

        if (values.length === 0){
          summary.textContent = "No ratings yet.";
          return;
        }

        const avg = (values.reduce((a,b) => a + b, 0) / values.length).toFixed(1);
        summary.textContent = `${avg} / 5 (${values.length} rating${values.length > 1 ? "s" : ""})`;
      } catch (err){
        console.error("Ratings load failed:", err);
      }
    }

    function highlightStars(value){
      stars.forEach(star => {
        star.classList.toggle("selected", Number(star.dataset.value) <= value);
      });
    }

    stars.forEach(star => {
      star.addEventListener("click", async function(){
        if (submitting) return;
        submitting = true;

        const value = parseInt(star.dataset.value, 10);
        try {
          await addDoc(ratingsRef, { value, createdAt: Date.now() });
          highlightStars(value);
          await updateSummary();
        } catch (err){
          console.error("Rating submit failed:", err);
        } finally {
          setTimeout(() => { submitting = false; }, 600);
        }
      });

      star.addEventListener("mouseenter", function(){
        highlightStars(parseInt(star.dataset.value, 10));
      });
    });

    starContainer.addEventListener("mouseleave", updateSummary);
    updateSummary();

  });

})();


/* ------------------------------------------------------------
   10. GLOBAL DOM-READY SETUP
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", function(){

  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", function(){
      const isOpen = item.classList.contains("open");
      faqItems.forEach(i => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  const panels = document.querySelectorAll(".food-panel");

  panels.forEach(panel => {
    if (!panel.querySelector(".food-info")) {
      const name   = panel.dataset.name   || "";
      const origin = panel.dataset.origin || "";
      const desc   = panel.dataset.desc   || "";

      const info = document.createElement("div");
      info.className = "food-info";
      info.innerHTML = `
        <span class="food-origin">${origin}</span>
        <h3 class="food-title">${name}</h3>
        <p class="food-desc">${desc}</p>
      `;
      panel.appendChild(info);
    }

    panel.setAttribute("tabindex", "0");
    panel.setAttribute("role", "button");
    panel.setAttribute("aria-label",
      `${panel.dataset.name || ""} — ${panel.dataset.origin || ""}`);

    const activate = () => {
      const wasActive = panel.classList.contains("active");
      panels.forEach(p => p.classList.remove("active"));
      if (!wasActive) panel.classList.add("active");
    };

    panel.addEventListener("click", activate);
    panel.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  const faders = document.querySelectorAll(".fade-in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    faders.forEach(el => io.observe(el));
  } else {
    faders.forEach(el => el.classList.add("visible"));
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSearch();
  });

  document.addEventListener("click", e => {
    const box = document.getElementById("searchBox");
    const btn = document.querySelector(".search-btn");
    if (!box || !box.classList.contains("show")) return;
    if (box.contains(e.target) || btn?.contains(e.target)) return;
    closeSearch();
  });

});


/* ============================================================
   LOADING SCREEN
   ============================================================ */
(function () {
    var LOADER_DURATION = 1000;  // 3 seconds

    function hideLoader() {
        var loader = document.getElementById("loader");
        if (!loader) return;
        loader.classList.add("hidden");
        setTimeout(function () {
            loader.style.display = "none";
        }, 700);
    }

    window.addEventListener("load", function () {
        setTimeout(hideLoader, LOADER_DURATION);
    });

    setTimeout(hideLoader, LOADER_DURATION + 1000);
})();

function toggleMobileMenu() {
    var nav = document.getElementById("main-nav");
    var btn = document.getElementById("menu-button");
    
    // Toggle the 'open' class on the nav
    nav.classList.toggle("open");
    
    // Change the button text
    if (nav.classList.contains("open")) {
        btn.textContent = "Close menu";
    } else {
        btn.textContent = "Menu";
    }
}


/* ------------------------------------------------------------
   11. EXPORTS
   ------------------------------------------------------------ */
window.toggleSidebar = toggleSidebar;
window.toggleSearch  = toggleSearch;
window.toggleMusic   = toggleMusic;