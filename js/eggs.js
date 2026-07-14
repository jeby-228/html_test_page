(function () {
  const TOTAL = 5;
  const found = new Set();
  const toastEl = document.getElementById("eggToast");
  const rainEl = document.getElementById("eggRain");
  const badgeEl = document.getElementById("eggBadge");
  const progressEl = document.getElementById("progress");
  const shuffleBtn = document.getElementById("shufflePalette");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";

  const SECRET_PALETTES = [
    {
      name: "午夜瀑布",
      ink: "#0b132b",
      teal: "#1c2541",
      mist: "#dce1eb",
      slate: "#3a506b",
      coral: "#5bc0be",
      white: "#f5f7fb",
    },
    {
      name: "紙上日落",
      ink: "#2b2d42",
      teal: "#8d99ae",
      mist: "#edf2f4",
      slate: "#ef233c",
      coral: "#d90429",
      white: "#ffffff",
    },
    {
      name: "苔原信號",
      ink: "#1a3a2a",
      teal: "#3d6b4f",
      mist: "#e8f0e9",
      slate: "#6b8f71",
      coral: "#c45c26",
      white: "#f6faf6",
    },
  ];

  let secretIndex = 0;
  let logoClicks = 0;
  let logoTimer = null;
  let typed = "";
  let chapterSeq = [];
  let progressClicks = [];

  const KONAMI = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let konamiBuf = [];

  function toast(message) {
    if (!toastEl) return;
    toastEl.hidden = false;
    toastEl.textContent = message;
    toastEl.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toastEl.classList.remove("is-show");
      setTimeout(() => {
        toastEl.hidden = true;
      }, 280);
    }, 2600);
  }

  function updateBadge() {
    if (!badgeEl) return;
    badgeEl.hidden = found.size === 0;
    badgeEl.textContent = found.size + "/" + TOTAL;
    badgeEl.classList.toggle("is-complete", found.size >= TOTAL);
  }

  function unlock(id, message) {
    if (found.has(id)) {
      toast(message);
      return false;
    }
    found.add(id);
    updateBadge();
    toast(message + (found.size >= TOTAL ? " · 全部找到了！" : ""));
    if (found.size >= TOTAL) celebrateAll();
    return true;
  }

  function cascadeRain(count) {
    if (!rainEl || reduceMotion) return;
    rainEl.innerHTML = "";
    const n = count || 28;
    const colors = [
      "var(--ink)",
      "var(--teal)",
      "var(--slate)",
      "var(--coral)",
      "var(--mist)",
    ];

    for (let i = 0; i < n; i++) {
      const bar = document.createElement("span");
      bar.className = "egg-rain__bar";
      bar.style.left = Math.random() * 100 + "vw";
      bar.style.background = colors[i % colors.length];
      bar.style.width = 8 + Math.random() * 22 + "px";
      bar.style.height = 18 + Math.random() * 48 + "px";
      bar.style.animationDelay = Math.random() * 0.45 + "s";
      bar.style.animationDuration = 0.9 + Math.random() * 0.8 + "s";
      rainEl.appendChild(bar);
    }

    rainEl.classList.add("is-active");
    clearTimeout(cascadeRain._t);
    cascadeRain._t = setTimeout(() => {
      rainEl.classList.remove("is-active");
      rainEl.innerHTML = "";
    }, 2200);
  }

  function celebrateAll() {
    cascadeRain(42);
    document.body.classList.add("egg-complete");
    if (hasGsap && !reduceMotion) {
      gsap.fromTo(
        ".egg-badge",
        { scale: 0.8 },
        { scale: 1.15, yoyo: true, repeat: 3, duration: 0.2, ease: "power1.inOut" }
      );
    }
    window.dispatchEvent(new CustomEvent("cascade:eggs-complete"));
  }

  function applySecretPalette() {
    const demo = window.CascadeDemo;
    if (!demo) return;
    const p = SECRET_PALETTES[secretIndex % SECRET_PALETTES.length];
    secretIndex += 1;
    demo.applyPalette(p);
    unlock("secret-palette", "隱藏色卡：「" + p.name + "」");
    cascadeRain(16);
  }

  function scrollToReveal() {
    const target = document.getElementById("reveal");
    if (!target) return;
    const lenis = window.CascadeDemo && window.CascadeDemo.getLenis();
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  function flipWorld() {
    document.body.classList.add("egg-flip");
    unlock("logo-flip", "重力？那是可選的。");
    cascadeRain(20);
    setTimeout(() => document.body.classList.remove("egg-flip"), 1600);
  }

  function discoKonami() {
    const demo = window.CascadeDemo;
    unlock("konami", "Konami 啟動：緊急停止協議");
    cascadeRain(36);
    window.dispatchEvent(new CustomEvent("cascade:konami"));
    if (!demo) return;

    let i = 0;
    const timer = setInterval(() => {
      demo.shufflePalette();
      i += 1;
      if (i >= 8) clearInterval(timer);
    }, 180);
  }

  // —— 1. Type "cascade"
  window.addEventListener("keydown", (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;

    // Konami
    konamiBuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
    if (KONAMI.every((k, i) => konamiBuf[i] === k)) {
      konamiBuf = [];
      discoKonami();
    }

    // Type cascade
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      typed = (typed + e.key.toLowerCase()).slice(-7);
      if (typed.endsWith("cascade")) {
        typed = "";
        unlock("type-cascade", "你拼出了 CASCADE");
        cascadeRain(32);
        if (hasGsap && !reduceMotion) {
          gsap.fromTo(
            ".brand__logo rect, .site-logo--float .logo-svg rect",
            { y: -20 },
            {
              y: 0,
              stagger: 0.06,
              duration: 0.5,
              ease: "bounce.out",
              overwrite: true,
            }
          );
        }
      }
    }
  });

  // —— 2. Shift + click shuffle → handled in main.js via CascadeEggs
  window.CascadeEggs = {
    applySecretPalette: applySecretPalette,
  };

  // —— 3. Click hero logo 5 times quickly
  const heroLogo = document.querySelector(".brand__logo");
  if (heroLogo) {
    heroLogo.style.cursor = "pointer";
    heroLogo.addEventListener("click", () => {
      logoClicks += 1;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(() => {
        logoClicks = 0;
      }, 1200);
      if (logoClicks >= 5) {
        logoClicks = 0;
        flipWorld();
      }
    });
  }

  // —— 4. Triple-click progress bar → jump to ending
  if (progressEl) {
    progressEl.style.pointerEvents = "auto";
    progressEl.style.cursor = "pointer";
    progressEl.title = "";
    progressEl.addEventListener("click", () => {
      const now = Date.now();
      progressClicks = progressClicks.filter((t) => now - t < 700);
      progressClicks.push(now);
      if (progressClicks.length >= 3) {
        progressClicks = [];
        unlock("progress-skip", "捷徑已開啟：直達結尾");
        scrollToReveal();
      }
    });
  }

  // —— 5. Click chapter numbers 01 → 02 → 03
  document.querySelectorAll("[data-egg-index]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      const n = Number(el.getAttribute("data-egg-index"));
      const next = chapterSeq.length + 1;
      if (n === next) {
        chapterSeq.push(n);
        if (hasGsap && !reduceMotion) {
          gsap.fromTo(el, { scale: 1 }, { scale: 1.08, yoyo: true, repeat: 1, duration: 0.15 });
        }
        if (chapterSeq.length === 3) {
          chapterSeq = [];
          unlock("chapter-seq", "01 → 02 → 03 解鎖敘事捷徑");
          cascadeRain(24);
        }
      } else {
        chapterSeq = n === 1 ? [1] : [];
      }
    });
  });

  // Console whisper
  const tip =
    "%cCASCADE%c 藏了幾個小彩蛋。提示：鍵盤、頂部進度條、章節大數字、Logo、還有 Shift。";
  try {
    console.log(tip, "font-weight:800;font-size:14px;color:#415a77", "color:#778da9");
    console.log(
      "%c更瘋的一層已上線：噬魂捲動 / 色卡瘟疫 / 重力合約 / 時間買賣 / 電梯艙門",
      "color:#e09f3e"
    );
  } catch (_) {
    /* ignore */
  }

  updateBadge();
})();
