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

  // Project texts (originals, as provided) – stored as HTML strings
  const projectTexts = {
    "on-seeing": {
      en: `
        <p>An observation of attention as it wavers and returns, as if it's breathing. These images are made without pursuit, often in moments when looking becomes detached from intention. Particles of gestures, temporary alignments, peripheral events… no arrangements or repetition is present here. The series explores what emerges when perception is allowed to remain incomplete, when the act of seeing is less about recognition and more about encounter. One could call it distraction, and maybe I do.</p>
      `,
      pt: `
        <p>Uma observação da atenção enquanto ela expande e contrai, como se respirasse. Estas imagens são feitas sem busca, muitas vezes em momentos em que o olhar se desprende da intenção. Partículas de gestos, alinhamentos temporários, acontecimentos periféricos… sem arranjos ou repetição. A série explora o que surge quando deixamos a percepção ser incompleta, quando o ato de ver é menos sobre reconhecer e mais sobre encontrar algo. Poderíamos chamar isso de distração, e talvez eu chame.</p>
      `,
    },

    "in-passing": {
      en: `
        <p>Photographs made while moving: walking, waiting, crossing, from the passenger seat, from any type of moving seat. The work resists fixation and instead follows what appears briefly along the way. Figures dissolve into architecture, shadows interrupt surfaces, glances go unanswered. What remains is a record of transition rather than arrival (is there such a thing, after all?), a trace of things encountered but not possessed.</p>
      `,
      pt: `
        <p>Fotografias feitas enquanto me movo: caminhando, esperando, atravessando, sentada no banco do passageiro, sentada em um banco qualquer, de coisa que move ou não (todas movem). O trabalho resiste à fixação e, ao invés, segue o que surge brevemente ao longo do caminho. Figuras se dissolvem na arquitetura, sombras interrompem superfícies, olhares ficam sem resposta. O que permanece é a transição,  já que a chegada, talvez, não exista. Um vestígio do que foi encontro e nunca posse.</p>
      `,
    },

    "meanwhile": {
      en: `
        <p>Made across intervals of distraction and pause, this series gathers scenes that exist beside declared events. Nothing announces itself as central. Light shifts, bodies lean, structures hold. The images operate in the space between occurrences, where duration stretches and narrative loosens. It is most probably not about climax, as perspective allows you to shuffle importance. I guess it's about the quiet continuity of the ordinary.</p>
      `,
      pt: `
        <p>Feita nos intervalos entre distração e pausa, esta série reúne cenas que existem um pouco à margem do que se reconhece como acontecimento. Nada se percebe como central. A luz se desloca, corpos se inclinam, estruturas sustentam. As imagens operam no espaço entre ocorrências, onde a duração se alonga e a narrativa se afrouxa. Muito provavelmente não se trata de clímax, já que a perspectiva permite embaralhar a importância das coisas. Talvez seja apenas a continuidade silenciosa do ordinário.</p>
      `,
    },

    "in-transit": {
      en: `
        <p>The attempt with these moving images is that it doesn't necessarily departs or arrives. They remain in passage: sometimes through the motion of the camera, other times through a voice, a current of air, a subtle shift in the frame… What moves is not always visible; it may be breath, light, a pulse beneath the surface of things.</p>
        <p>The work inhabits a middle state. It does not advance toward resolution, nor does it settle. It continues. In this continuity, attention drifts and gathers, and movement becomes less an event than a condition of being.</p>
      `,
      pt: `
        <p>A tentativa com estas imagens em movimento é que não partam, necessariamente, e nem cheguem. Elas permanecem em passagem: às vezes pelo movimento da câmera, às vezes por uma voz, uma corrente de ar, um deslocamento sutil no enquadramento… O que se move nem sempre é visível; pode ser respiração, luz, um pulsar sob a superfície das coisas.</p>
        <p>O trabalho habita um estado intermediário. Ele não avança em direção à resolução, e nem se acomoda. Ele continua. Nessa continuidade, a atenção deriva e se recompõe, e o movimento deixa de ser acontecimento para tornar-se condição de ser.</p>
      `,
    },
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

  /* ---------------- Helpers ---------------- */

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function removeVimeoIframe() {
    if (!viewerContent) return;
    const iframe = viewerContent.querySelector("iframe");
    if (iframe) iframe.remove();
  }

  function removeProjectIntro() {
    if (!viewerContent) return;
    const intro = viewerContent.querySelector(".project-intro");
    if (intro) intro.remove();
  }

  function hardResetViewerMedia() {
    removeVimeoIframe();
    removeProjectIntro();

    if (viewerImg) {
      viewerImg.hidden = false;
      viewerImg.removeAttribute("src");
    }
  }

  /* ---------------- Splash ---------------- */

  function enterWork() {
    state = "work";
    if (splash) splash.hidden = true;
    body.classList.remove("locked");
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", enterWork);
  }

  /* ---------------- Navigation ---------------- */

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.nav;
      if (target === "work") enterWork();
      else {
        state = "page";
        body.classList.remove("locked");
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ---------------- Project Intro ---------------- */

  function renderProjectIntro() {
    if (!viewerContent || !activeProject) return;

    removeProjectIntro();

    const data = projectTexts[activeProject];
    if (!data) return;

    const intro = document.createElement("div");
    intro.className = "project-intro";

    const STORAGE_KEY = `pt_project_${activeProject}`;
    const ptOpen = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === "1";
      } catch (_) {
        return false;
      }
    })();

    intro.innerHTML = `
      <div class="en-text">${data.en}</div>
      <button type="button" class="pt-reveal" aria-expanded="${ptOpen ? "true" : "false"}">Português</button>
      <div class="pt-text" ${ptOpen ? "" : "hidden"}>${data.pt}</div>
    `;

    const btn = intro.querySelector(".pt-reveal");
    const ptBlock = intro.querySelector(".pt-text");

    if (btn && ptBlock) {
      btn.addEventListener("click", () => {
        ptBlock.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch (_) {}
      });
    }

    // Place intro at the very top of viewer content (above media)
    viewerContent.insertBefore(intro, viewerContent.firstChild);
  }

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

  /* ---------------- Viewer: open/close ---------------- */

  function openViewer(project, type) {
    state = "viewer";
    activeProject = project;
    activeType = type || "image";
    currentIndex = 1;

    body.classList.add("locked");
    if (viewer) viewer.hidden = false;

    // Always start clean (prevents “last image sticks”)
    hardResetViewerMedia();

    // Intro should never block media
    try {
      renderProjectIntro();
    } catch (err) {
      console.error("Project intro error:", err);
    }

    renderMedia();
  }

  function closeViewer() {
    state = "work";
    hardResetViewerMedia();
    if (viewer) viewer.hidden = true;
    body.classList.remove("locked");
  }

  /* ---------------- Viewer: render media ---------------- */

  function renderMedia() {
    if (!counter || !activeProject) return;

    const total = projects[activeProject] ?? 0;
    counter.textContent = `${currentIndex} / ${total || "?"}`;

    // VIDEO (Vimeo)
    if (activeType === "video") {
      if (!viewerContent) return;

      if (viewerImg) viewerImg.hidden = true;

      removeVimeoIframe();

      const videoId = vimeoIds[activeProject]?.[currentIndex - 1];
      if (!videoId) return;

      const iframe = document.createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("title", activeProject);

      // Insert before counter
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

  /* ---------------- Viewer: mobile swipe (iOS/Android) ---------------- */

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

        const dx = lastX - startX;
        const dy = lastY - startY;

        const TAP_MAX = 14;
        const SWIPE_MIN = 35;

        // Tap: advance images only (do not steal taps from Vimeo)
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

    // Prevent ghost clicks after touch. Do not block iframe/player.
    viewerContent.addEventListener("click", (e) => {
      if (state !== "viewer") return;

      const tag = e.target?.tagName?.toLowerCase?.() || "";
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

  function openPortugueseAbout() {
    if (!aboutPt || !ptReveal) return;
    aboutPt.hidden = false;
    ptReveal.setAttribute("aria-expanded", "true");
    try {
      localStorage.setItem(PT_KEY, "1");
    } catch (_) {}
  }

  try {
    if (localStorage.getItem(PT_KEY) === "1") openPortugueseAbout();
  } catch (_) {}

  if (ptReveal && aboutPt) {
    ptReveal.addEventListener("click", () => {
      if (!aboutPt.hidden) return;
      openPortugueseAbout();
    });
  }
});
