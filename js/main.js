(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 899px)").matches;
  const progressEl = document.getElementById("progress");
  const railSection = document.getElementById("rail");
  const railTrack = document.getElementById("railTrack");
  const reveal = document.getElementById("reveal");
  const floatLogo = document.querySelector(".site-logo--float");
  const hero = document.getElementById("top");
  const shuffleBtn = document.getElementById("shufflePalette");
  const coolorsLink = document.getElementById("coolorsLink");
  const root = document.documentElement;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  let lastPaletteKey = "";
  let lastPalette = null;
  let lenis = null;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = (v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, "0");
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function hexToRgb(hex) {
    const n = hex.replace("#", "");
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ];
  }

  function paletteKey(p) {
    return [p.ink, p.teal, p.mist, p.slate, p.coral].join("-");
  }

  function generatePalette() {
    for (let i = 0; i < 24; i++) {
      const base = rand(0, 360);
      const ink = hslToHex(base, rand(28, 55), rand(10, 22));
      const teal = hslToHex(base + rand(-18, 22), rand(32, 58), rand(32, 48));
      const mist = hslToHex(base + rand(-20, 20), rand(8, 28), rand(88, 96));
      const slate = hslToHex(base + rand(18, 48), rand(18, 40), rand(42, 58));
      const coral = hslToHex(base + rand(120, 210), rand(55, 82), rand(48, 62));
      const white = hslToHex(base, rand(6, 18), rand(96, 99));
      const palette = { ink, teal, mist, slate, coral, white };
      if (paletteKey(palette) !== lastPaletteKey) return palette;
    }
    const base = (Date.now() % 360) + rand(40, 120);
    return {
      ink: hslToHex(base, 45, 16),
      teal: hslToHex(base + 20, 48, 40),
      mist: hslToHex(base, 16, 93),
      slate: hslToHex(base + 35, 28, 50),
      coral: hslToHex(base + 170, 70, 55),
      white: hslToHex(base, 10, 98),
    };
  }

  function applyPalette(palette, options) {
    const opts = options || {};
    const map = {
      ink: palette.ink,
      teal: palette.teal,
      mist: palette.mist,
      slate: palette.slate,
      coral: palette.coral,
      white: palette.white,
    };

    Object.keys(map).forEach((name) => {
      const hex = map[name];
      root.style.setProperty("--" + name, hex);
      root.style.setProperty("--" + name + "-rgb", hexToRgb(hex).join(", "));
    });

    document.querySelectorAll("[data-swatch]").forEach((el) => {
      const name = el.getAttribute("data-swatch");
      const hex = map[name];
      if (!hex) return;
      el.style.background = hex;
      el.setAttribute("title", hex.toUpperCase());
    });

    const slug = [palette.ink, palette.teal, palette.mist, palette.slate, palette.coral]
      .map((h) => h.replace("#", "").toLowerCase())
      .join("-");

    if (coolorsLink) coolorsLink.href = "https://coolors.co/" + slug;
    lastPaletteKey = paletteKey(palette);
    lastPalette = Object.assign({}, map, { name: palette.name || "" });

    if (!opts.silent) {
      window.dispatchEvent(
        new CustomEvent("cascade:palette", {
          detail: {
            palette: lastPalette,
            source: opts.source || "local",
          },
        })
      );
    }
  }

  function shufflePalette() {
    applyPalette(generatePalette());

    if (hasGsap && !reduceMotion) {
      try {
        gsap.fromTo(
          "#dockSwatches span, #footerSwatches .swatch",
          { scale: 0.7, y: 6 },
          {
            scale: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.05,
            ease: "back.out(1.8)",
            overwrite: true,
          }
        );
        gsap.fromTo(
          shuffleBtn,
          { rotate: 0 },
          { rotate: 360, duration: 0.55, ease: "power2.out", overwrite: true }
        );
      } catch (_) {
        /* ignore animation errors */
      }
    } else if (shuffleBtn) {
      shuffleBtn.classList.remove("is-spinning");
      void shuffleBtn.offsetWidth;
      shuffleBtn.classList.add("is-spinning");
    }
  }

  applyPalette(
    {
      ink: "#1b263b",
      teal: "#415a77",
      mist: "#e0e1dd",
      slate: "#778da9",
      coral: "#e09f3e",
      white: "#f4f5f2",
    },
    { silent: true }
  );

  function onShuffleClick(e) {
    if (
      e.shiftKey &&
      window.CascadeEggs &&
      typeof window.CascadeEggs.applySecretPalette === "function"
    ) {
      e.preventDefault();
      window.CascadeEggs.applySecretPalette();
      return;
    }
    shufflePalette();
  }

  if (shuffleBtn) {
    shuffleBtn.type = "button";
    shuffleBtn.removeAttribute("disabled");
    shuffleBtn.style.pointerEvents = "auto";
    shuffleBtn.addEventListener("click", onShuffleClick);
  }

  const dockSwatches = document.getElementById("dockSwatches");
  if (dockSwatches) {
    dockSwatches.style.cursor = "pointer";
    dockSwatches.title = "點擊也可換色";
    dockSwatches.addEventListener("click", onShuffleClick);
  }

  function initLenis() {
    if (reduceMotion || typeof Lenis === "undefined") return null;
    // 手機用原生捲動較跟手，避免 Lenis 拖泥帶水
    if (window.matchMedia("(max-width: 899px)").matches) return null;
    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (hasGsap) {
      instance.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => instance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        instance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        instance.scrollTo(target, { offset: 0 });
      });
    });

    return instance;
  }

  function initMotion() {
    if (!hasGsap) return initFallbackScroll();

    gsap.registerPlugin(ScrollTrigger);

    // Progress bar
    gsap.to(progressEl, {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });

    if (!reduceMotion) {
      // Hero entrance
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".brand__logo rect", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.55,
          stagger: 0.08,
        })
        .from(
          ".brand__logo text",
          { opacity: 0, x: -24, duration: 0.55 },
          "-=0.25"
        )
        .from(
          ".hero__headline, .hero__content > p:not(.hero__headline), .hero__content .cta",
          {
            opacity: 0,
            y: 28,
            duration: 0.7,
            stagger: 0.1,
          },
          "-=0.35"
        )
        .from(
          ".palette-dock",
          { opacity: 0, x: 28, duration: 0.6 },
          "-=0.45"
        );

      // Hero parallax layers
      document.querySelectorAll(".hero__layer").forEach((layer) => {
        const speed = parseFloat(layer.dataset.speed) || 0.2;
        gsap.to(layer, {
          y: () => window.innerHeight * speed * 0.85,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      gsap.to(".hero__content", {
        y: 80,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "center top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Chapter sticky copy
      document.querySelectorAll(".chapter__sticky").forEach((sticky) => {
        gsap.from(sticky.querySelectorAll(".chapter__index, h2, p"), {
          opacity: 0,
          y: 36,
          duration: 0.85,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sticky,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Progressive beats
      document.querySelectorAll("[data-beat]").forEach((beat) => {
        if (isMobile || reduceMotion) {
          // 手機改為簡單進場，避免 scrub 造成半透明難讀
          gsap.fromTo(
            beat,
            { opacity: 0.35, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: {
                trigger: beat,
                start: "top 88%",
                toggleActions: "play none none reverse",
                onEnter: () => beat.classList.add("is-active"),
              },
            }
          );
          return;
        }

        gsap.fromTo(
          beat,
          { opacity: 0.18, y: 48 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: beat,
              start: "top 78%",
              end: "top 42%",
              scrub: 0.6,
              onEnter: () => beat.classList.add("is-active"),
              onLeaveBack: () => beat.classList.remove("is-active"),
            },
          }
        );
      });

      // Horizontal rail
      if (railSection && railTrack) {
        const getRailX = () =>
          -(Math.max(0, railTrack.scrollWidth - window.innerWidth + 24));

        gsap.to(railTrack, {
          x: getRailX,
          ease: "none",
          scrollTrigger: {
            trigger: railSection,
            start: "top top",
            end: "bottom bottom",
            scrub: isMobile ? 0.2 : 0.55,
            invalidateOnRefresh: true,
          },
        });

        gsap.from(".rail-intro", {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: railSection,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".rail-panel", {
          scale: 0.92,
          opacity: 0.45,
          stagger: 0.08,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: railSection,
            start: "top top",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Closing reveal
      if (reveal) {
        const revealTl = gsap.timeline({
          scrollTrigger: {
            trigger: reveal,
            start: "top 70%",
            toggleActions: "play none none reverse",
            onEnter: () => reveal.classList.add("is-inview"),
            onLeaveBack: () => reveal.classList.remove("is-inview"),
          },
        });
        revealTl
          .fromTo(
            ".reveal__line",
            { opacity: 0, y: 40, rotateX: 25 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: "power3.out",
            }
          )
          .fromTo(
            ".reveal__inner p",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
            "-=0.25"
          );
      }

      // Floating logo
      if (floatLogo && hero) {
        ScrollTrigger.create({
          trigger: hero,
          start: "bottom top+=80",
          onEnter: () => {
            floatLogo.classList.add("is-visible");
            gsap.fromTo(
              floatLogo,
              { y: -12, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out", overwrite: true }
            );
          },
          onLeaveBack: () => {
            gsap.to(floatLogo, {
              y: -8,
              autoAlpha: 0,
              duration: 0.25,
              overwrite: true,
              onComplete: () => floatLogo.classList.remove("is-visible"),
            });
          },
        });
      }
    } else {
      document.querySelectorAll("[data-beat]").forEach((el) => el.classList.add("is-active"));
      if (reveal) reveal.classList.add("is-inview");
      if (floatLogo) {
        ScrollTrigger.create({
          trigger: hero,
          start: "bottom top+=80",
          onEnter: () => floatLogo.classList.add("is-visible"),
          onLeaveBack: () => floatLogo.classList.remove("is-visible"),
        });
      }
      if (railSection && railTrack) {
        gsap.to(railTrack, {
          x: () => -(Math.max(0, railTrack.scrollWidth - window.innerWidth + 56)),
          ease: "none",
          scrollTrigger: {
            trigger: railSection,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      }
    }

    window.addEventListener("resize", () => ScrollTrigger.refresh());
  }

  function initFallbackScroll() {
    const heroLayers = document.querySelectorAll(".hero__layer");
    const beats = document.querySelectorAll("[data-beat]");

    function updateProgress() {
      const max = root.scrollHeight - window.innerHeight;
      progressEl.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }

    function updateFloatLogo() {
      if (!floatLogo || !hero) return;
      const show = hero.getBoundingClientRect().bottom < 80;
      floatLogo.classList.toggle("is-visible", show);
      floatLogo.style.opacity = show ? "1" : "0";
      floatLogo.style.visibility = show ? "visible" : "hidden";
    }

    function updateParallax() {
      if (reduceMotion) return;
      const y = window.scrollY;
      heroLayers.forEach((layer) => {
        const speed = parseFloat(layer.dataset.speed) || 0.2;
        layer.style.transform = "translateY(" + y * speed + "px)";
      });
    }

    function updateRail() {
      if (!railSection || !railTrack) return;
      const rect = railSection.getBoundingClientRect();
      const total = railSection.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const maxX = Math.max(0, railTrack.scrollWidth - window.innerWidth + 56);
      railTrack.style.transform = "translate3d(" + -progress * maxX + "px, 0, 0)";
    }

    function updateBeats() {
      const mid = window.innerHeight * 0.62;
      beats.forEach((beat) => {
        const r = beat.getBoundingClientRect();
        beat.classList.toggle(
          "is-active",
          (r.top < mid && r.bottom > window.innerHeight * 0.15) || reduceMotion
        );
      });
    }

    function updateReveal() {
      if (!reveal) return;
      const r = reveal.getBoundingClientRect();
      reveal.classList.toggle(
        "is-inview",
        (r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.2) ||
          reduceMotion
      );
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress();
        updateFloatLogo();
        updateParallax();
        updateRail();
        updateBeats();
        updateReveal();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  lenis = initLenis();
  initMotion();

  window.CascadeDemo = {
    applyPalette,
    shufflePalette,
    generatePalette,
    getLenis: () => lenis,
    getPalette: () => lastPalette,
    stopScroll: () => {
      if (lenis) lenis.stop();
      document.documentElement.classList.add("is-scroll-locked");
    },
    startScroll: () => {
      if (lenis) lenis.start();
      document.documentElement.classList.remove("is-scroll-locked");
    },
  };
})();
