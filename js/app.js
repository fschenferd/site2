document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- State ---------------- */

  let state = "splash"; // splash | work | page | viewer
  let activeProject = null;
  let activeType = "image"; // image | video
  let currentIndex = 1;

  // Counts for image projects; for video projects, this is number of clips
  const projects = {
    "on-seeing": 12,
    "in-passing": 12,
    "meanwhile": 12,
    "in-transit": 1,
  };

  // Vimeo IDs per video project (index 0 = 01, index 1 = 02, etc.)
  const vimeoIds = {
    "in-transit": ["1164968539"],
  };

  // Project texts 


  
  /* ---------------- Elements ---------------- */

  const body = document.body;

  const splash = document.getElementById("splash");
  const enterBtn = document.getElementById("enter");

  const viewer = document.getElementById("viewer");
  const viewerBackdrop = document.getElementById("viewer-backdrop");
  const viewerContent = document.getElementById("viewer-content");
  const viewerImg = document.getElementById("viewer-img");
  const counter = document.getElementById("counter");

  /* ---------------- Helpers ---------------- */

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function removeVimeoIframe() {
    if (!viewerContent) return;
    const iframe = viewerContent.querySelector("iframe");
    if (iframe) iframe.remove();
  }

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

  function openViewer(project, type) {
    state = "viewer";
    activeProject = project;
    activeType = type || "image";
    currentIndex = 1;

    body.classList.add("locked");
    if (viewer) viewer.hidden = false;

    renderProjectIntro();
    renderMedia();
  }

  function closeViewer() {
    state = "work";

    // Remove Vimeo if present
    removeVimeoIframe();

    // Restore image node for next open
    if (viewerImg) viewerImg.hidden = false;

    if (viewer) viewer.hidden = true;
    body.classList.remove("locked");
  }

  /* ---------------- Splash ---------------- */

  if (enterBtn) {
    enterBtn.addEventListener("click", enterWork);
  }

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
      const type = card.dataset.type || "image";
      if (!project) return;
      openViewer(project, type);
    });
  });

  /* ---------------- Project Intro ---------------- */

  function renderProjectIntro() {
  if (!viewerContent || !activeProject) return;

  const existingIntro = viewerContent.querySelector(".project-intro");
  if (existingIntro) existingIntro.remove();

  const data = projectTexts[activeProject];
  if (!data) return;

  const intro = document.createElement("div");
  intro.className = "project-intro";

  const ptOpen = localStorage.getItem(`pt_${activeProject}`) === "1";

  intro.innerHTML = `
    <div class="en-text">${data.en}</div>
    <button type="button">Português</button>
    <div class="pt-text" ${ptOpen ? "" : "hidden"}>${data.pt}</div>
  `;

  const button = intro.querySelector("button");
  const ptBlock = intro.querySelector(".pt-text");

  button.addEventListener("click", () => {
    ptBlock.hidden = false;
    localStorage.setItem(`pt_${activeProject}`, "1");
  });

  viewerContent.insertBefore(intro, viewerContent.firstChild);
}

  /* ---------------- Viewer: render media ---------------- */

  function renderMedia() {
    if (!counter || !activeProject) return;

    const total = projects[activeProject] ?? 0;
    counter.textContent = `${currentIndex} / ${total || "?"}`;

    // VIDEO (Vimeo)
    if (activeType === "video") {
      if (!viewerContent) return;

      // Hide the image element while video is shown
      if (viewerImg) viewerImg.hidden = true;

      // Replace any existing iframe
      removeVimeoIframe();

      const videoId = vimeoIds[activeProject]?.[currentIndex - 1];
      if (!videoId) return;

      const iframe = document.createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("title", activeProject);

  
      // Insert before the counter
      viewerContent.insertBefore(iframe, counter || null);
      return;
    }

    // IMAGE
    removeVimeoIframe();
    if (!viewerImg) return;

    viewerImg.hidden = false;
    const file = `${pad2(currentIndex)}.jpg`;
    viewerImg.src = `images/${activeProject}/${file}`;
  }

  function nextItem() {
    const total = projects[activeProject] ?? 0;
    if (!total) return;

    if (currentIndex < total) {
      currentIndex += 1;
      renderMedia();
    } else {
      closeViewer();
    }
  }

  function prevItem() {
    if (currentIndex > 1) {
      currentIndex -= 1;
      renderMedia();
    }
  }

  /* ---------------- Viewer: close on backdrop ---------------- */

  if (viewerBackdrop) {
    viewerBackdrop.addEventListener("click", closeViewer);
  }

  /* ---------------- Viewer: keyboard ---------------- */

  window.addEventListener("keydown", (e) => {
    if (state !== "viewer") return;

    if (e.key === "Escape") {
      closeViewer();
      return;
    }

    if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
      nextItem();
      return;
    }

    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
      prevItem();
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

        // Tap (or near-tap):
        // - For images: advance
        // - For Vimeo: do nothing (taps should operate player UI)
        if (Math.abs(dx) <= TAP_MAX && Math.abs(dy) <= TAP_MAX) {
          if (activeType !== "video") nextItem();
          return;
        }

        // Horizontal swipe only
        if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;

        if (dx < 0) nextItem();
        else prevItem();
      },
      { passive: true }
    );

    // Prevent ghost clicks after touch; do not block Vimeo player controls
    viewerContent.addEventListener("click", (e) => {
      if (state !== "viewer") return;

      const tag = e.target?.tagName?.toLowerCase?.() || "";
      // Allow clicks inside the iframe/player UI to work normally
      if (tag === "iframe") return;

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
    } catch (_) {}
  }

  try {
    if (localStorage.getItem(PT_KEY) === "1") openPortuguese();
  } catch (_) {}

  if (ptReveal && aboutPt) {
    ptReveal.addEventListener("click", () => {
      if (!aboutPt.hidden) return; // reveal only
      openPortuguese();
    });
  }
});
