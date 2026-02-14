document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- State ---------------- */

  let state = "splash"; // splash | work | page | viewer
  let activeProject = null;
  let currentIndex = 1;

  // Adjust counts to match your folders
  const projects = {
    "on-seeing": 12,
    "in-passing": 12,
    "meanwhile": 12,
  };

  /* ---------------- Elements ---------------- */

  const body = document.body;

  const splash = document.getElementById("splash");
  const enterBtn = document.getElementById("enter");

  const workStrip = document.getElementById("work");

  const viewer = document.getElementById("viewer");
  const viewerImg = document.getElementById("viewer-img");
  const viewerBackdrop = document.getElementById("viewer-backdrop");
  const viewerContent = document.getElementById("viewer-content");
  const counter = document.getElementById("counter");

  /* ---------------- State transitions ---------------- */

  function enterWork() {
    state = "work";
    if (splash) splash.hidden = true;
    body.classList.remove("locked");
  }

  function enterPage(sectionId) {
    state = "page";
    body.classList.remove("locked");
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openViewer(project) {
    state = "viewer";
    activeProject = project;
    currentIndex = 1;

    body.classList.add("locked");
    if (viewer) viewer.hidden = false;

    renderImage();
  }

  function closeViewer() {
    state = "work";
    if (viewer) viewer.hidden = true;
    body.classList.remove("locked");
  }

  /* ---------------- Splash ---------------- */

  if (enterBtn) {
    enterBtn.addEventListener("click", enterWork);
  }

  // Optional: allow any key to enter (if you want)
  // window.addEventListener("keydown", () => {
  //   if (state === "splash") enterWork();
  // }, { once: true });

  /* ---------------- Navigation ---------------- */

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.nav;
      if (target === "work") enterWork();
      else enterPage(target);
    });
  });

  /* ---------------- Work cards ---------------- */

  document.querySelectorAll("[data-project]").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const project = card.dataset.project;
      if (!project) return;
      openViewer(project);
    });
  });

  /* ---------------- Viewer ---------------- */

  function renderImage() {
    if (!viewerImg || !counter || !activeProject) return;

    const file = `${String(currentIndex).padStart(2, "0")}.jpg`;
    viewerImg.src = `images/${activeProject}/${file}`;
    counter.textContent = `${currentIndex} / ${projects[activeProject] ?? "?"}`;
  }

  function nextImage() {
    const total = projects[activeProject] ?? 0;
    if (currentIndex < total) {
      currentIndex += 1;
      renderImage();
    } else {
      closeViewer();
    }
  }

  function prevImage() {
    if (currentIndex > 1) {
      currentIndex -= 1;
      renderImage();
    }
  }

  if (viewerBackdrop) {
    viewerBackdrop.addEventListener("click", closeViewer);
  }

  window.addEventListener("keydown", (e) => {
    if (state !== "viewer") return;

    if (e.key === "Escape") {
      closeViewer();
      return;
    }

    if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
      nextImage();
      return;
    }

    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
      prevImage();
      return;
    }
  });

  /* ---------------- Viewer: mobile tap + swipe (iOS/Android) ---------------- */

  if (viewerContent) {
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    viewerContent.addEventListener(
      "touchstart",
      (e) => {
        if (state !== "viewer") return;
        if (e.touches.length !== 1) return;

        const t = e.touches[0];
        startX = lastX = t.clientX;
        startY = lastY = t.clientY;
      },
      { passive: true }
    );

    viewerContent.addEventListener(
      "touchmove",
      (e) => {
        if (state !== "viewer") return;
        if (e.touches.length !== 1) return;

        const t = e.touches[0];
        lastX = t.clientX;
        lastY = t.clientY;

        // Critical for iOS: stop browser gesture arbitration
        e.preventDefault();
      },
      { passive: false }
    );

    viewerContent.addEventListener(
      "touchend",
      () => {
        if (state !== "viewer") return;

        const dx = lastX - startX;
        const dy = lastY - startY;

        const TAP_MAX = 14; // tolerate jitter
        const SWIPE_MIN = 35; // intentional swipe

        // Tap (or near-tap) => next
        if (Math.abs(dx) <= TAP_MAX && Math.abs(dy) <= TAP_MAX) {
          nextImage();
          return;
        }

        // Horizontal swipe only
        if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;

        if (dx < 0) nextImage(); // swipe left
        else prevImage(); // swipe right
      },
      { passive: true }
    );

    // Prevent ghost click after touch
    viewerContent.addEventListener("click", (e) => {
      if (state !== "viewer") return;
      e.preventDefault();
      e.stopPropagation();
    });
  }

  /* ---------------- Parallax (desktop only) ---------------- */

  const hasFinePointer =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hasFinePointer) {
    document.querySelectorAll(".card").forEach((card) => {
      const img = card.querySelector(".card-media img");
      if (!img) return;

      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;

        img.style.transform = `scale(1.06) translate(${x * 12}px, ${y * 8}px)`;
      });

      card.addEventListener("mouseleave", () => {
        img.style.transform = "scale(1.03) translate(0,0)";
      });
    });
  }

  /* ---------------- About: Portuguese reveal (persist) ---------------- */

  const ptReveal = document.getElementById("pt-reveal");
  const aboutPt = document.getElementById("about-pt");
  const PT_KEY = "about_pt_open";

  function openPortuguese() {
    if (!aboutPt || !ptReveal) return;
    aboutPt.hidden = false;
    ptReveal.setAttribute("aria-expanded", "true");
    try {
      localStorage.setItem(PT_KEY, "1");
    } catch (_) {
      // ignore
    }
  }

  // Restore persisted state
  try {
    if (localStorage.getItem(PT_KEY) === "1") openPortuguese();
  } catch (_) {
    // ignore
  }

  if (ptReveal && aboutPt) {
    ptReveal.addEventListener("click", () => {
      if (!aboutPt.hidden) return; // reveal only, no toggle
      openPortuguese();
    });
  }
});
