document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- State ---------------- */

  let state = "splash"; // splash | work | page | viewer
  let activeProject = null;
  let activeType = "image"; // image | video
  let currentIndex = 1;

  // Counts for image projects; for video, treat as number of clips
  const projects = {
    "on-seeing": 12,
    "in-passing": 12,
    "meanwhile": 12,
    "in-transit": 1, // number of videos in this gallery
  };

  /* ---------------- Elements ---------------- */

  const body = document.body;

  const splash = document.getElementById("splash");
  const enterBtn = document.getElementById("enter");

  const viewer = document.getElementById("viewer");
  const viewerBackdrop = document.getElementById("viewer-backdrop");
  const viewerContent = document.getElementById("viewer-content");
  const viewerImg = document.getElementById("viewer-img");
  const counter = document.getElementById("counter");

  // We'll create/remove a <video> element dynamically
  let viewerVideo = null;

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

    renderMedia();
  }

  function closeViewer() {
    state = "work";
    stopAndRemoveVideo();
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

  /* ---------------- Viewer: media rendering ---------------- */

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function stopAndRemoveVideo() {
    if (!viewerVideo) return;
    try {
      viewerVideo.pause();
      viewerVideo.removeAttribute("src");
      viewerVideo.load();
    } catch (_) {}
    viewerVideo.remove();
    viewerVideo = null;
  }

  function ensureVideoElement() {
    if (viewerVideo) return viewerVideo;

    // Hide image element when video is active
    if (viewerImg) viewerImg.hidden = true;

    const v = document.createElement("video");
    v.id = "viewer-video";
    v.playsInline = true; // iOS: keep inline
    v.preload = "metadata";
    v.controls = true; // keep minimal but clear; can remove later
    v.style.maxWidth = "min(92vw, 1200px)";
    v.style.maxHeight = "82vh";
    v.style.borderRadius = "14px";
    v.style.boxShadow = "0 18px 70px rgba(0,0,0,0.7)";

    // Insert video where the image is, at the top of viewer-content
    if (viewerContent) {
      viewerContent.insertBefore(v, counter || null);
    }

    viewerVideo = v;
    return v;
  }

  function renderMedia() {
    if (!counter || !activeProject) return;

    const total = projects[activeProject] ?? 0;
    counter.textContent = `${currentIndex} / ${total || "?"}`;

    if (activeType === "video") {
      const v = ensureVideoElement();

      // Prefer MP4; optionally add WebM as a second source
      const file = `${pad2(currentIndex)}`;
      const mp4 = `videos/${activeProject}/${file}.mp4`;
      const webm = `videos/${activeProject}/${file}.webm`;

      // Reset sources cleanly
      v.innerHTML = "";
      const s1 = document.createElement("source");
      s1.src = mp4;
      s1.type = "video/mp4";
      v.appendChild(s1);

      // Optional: include WebM if you add it
      const s2 = document.createElement("source");
      s2.src = webm;
      s2.type = "video/webm";
      v.appendChild(s2);

      v.load();
      // Do not autoplay with sound; leave to user. (muted autoplay can be added later.)
      return;
    }

    // Image project
    stopAndRemoveVideo();
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

        e.preventDefault();
      },
      { passive: false }
    );

    viewerContent.addEventListener(
      "touchend",
      () => {
        if (state !== "viewer") return;

        // If the user is interacting with video controls, don't steal gestures.
        // (iOS often targets the <video> element)
        // We keep this lightweight; controls remain usable.
        const dx = lastX - startX;
        const dy = lastY - startY;

        const TAP_MAX = 14;
        const SWIPE_MIN = 35;

        if (Math.abs(dx) <= TAP_MAX && Math.abs(dy) <= TAP_MAX) {
          // Tap advances only for image galleries.
          // For video, tap should remain play/pause via native controls.
          if (activeType !== "video") nextItem();
          return;
        }

        if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;

        if (dx < 0) nextItem();
        else prevItem();
      },
      { passive: true }
    );

    viewerContent.addEventListener("click", (e) => {
      if (state !== "viewer") return;
      // Prevent ghost clicks after touch; do not block video control clicks.
      // If the click originated from the video element, allow it.
      const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if (targetTag === "video" || targetTag === "source") return;

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
      if (!aboutPt.hidden) return;
      openPortuguese();
    });
  }
});
