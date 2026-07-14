(function () {
  const tabId = "tab-" + Math.random().toString(36).slice(2, 9);
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("cascade-madness")
      : null;

  const soulLayer = document.getElementById("soulLayer");
  const soulCountEl = document.getElementById("soulCount");
  const timeHud = document.getElementById("timeHud");
  const timeValue = document.getElementById("timeValue");
  const timeBought = document.getElementById("timeBought");
  const floorHud = document.getElementById("floorHud");
  const floorLabel = document.getElementById("floorLabel");
  const infectBanner = document.getElementById("infectBanner");
  const alarmOverlay = document.getElementById("alarmOverlay");
  const contractModal = document.getElementById("gravityContract");
  const contractAccept = document.getElementById("contractAccept");
  const contractDismiss = document.getElementById("contractDismiss");
  const contractFlip = document.getElementById("contractFlip");
  const doorStage = document.getElementById("elevatorDoors");
  const blankExit = document.getElementById("blankExit");
  const openDoorsBtn = document.getElementById("openDoorsBtn");
  const madnessHud = document.getElementById("madnessHud");
  const madnessToggle = document.getElementById("madnessToggle");

  const FAKE_TABS = [
    { title: "Gmail — 收件匣 (482)", line: "Re: 明天的會議可以改線上嗎" },
    { title: "Untitled Document", line: "TODO: 記得刪掉這段人生設定" },
    { title: "YouTube", line: "再看一個就睡（謊言）" },
    { title: "localhost:3000", line: "Error: Maximum update depth exceeded" },
    { title: "銀行 App", line: "您的帳戶餘額看起來很累" },
    { title: "Notion — Life OS", line: "空白頁比夢想還多" },
    { title: "ChatGPT", line: "請幫我寫一封看起來有在努力的信" },
    { title: "Maps", line: "您已偏離路線 47 次" },
    { title: "Slack", line: "有人在嗎（沒有人在）" },
    { title: "天气", line: "今日適合後悔" },
  ];

  let soulsStolen = 0;
  let lastSoulY = 0;
  let secondsLeft = 600;
  let secondsBought = 0;
  let scrollBucket = 0;
  let emergency = false;
  let gravitySigned = false;
  let gravityOk = false;
  let doorsOpened = false;
  let floor = "L0";
  let audioCtx = null;
  let madnessOn = false;

  function demo() {
    return window.CascadeDemo;
  }

  function toast(msg) {
    const el = document.getElementById("eggToast");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.classList.remove("is-show");
      setTimeout(() => {
        el.hidden = true;
      }, 280);
    }, 2800);
  }

  function beep(freq, dur, type) {
    if (!madnessOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.035;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.stop(audioCtx.currentTime + dur);
    } catch (_) {
      /* ignore */
    }
  }

  function dingFloor() {
    beep(880, 0.08);
    setTimeout(() => beep(1320, 0.1), 90);
  }

  function alarmBeep() {
    beep(220, 0.15, "sawtooth");
    setTimeout(() => beep(180, 0.2, "sawtooth"), 160);
  }

  function setMadness(on) {
    madnessOn = on;
    if (madnessHud) {
      madnessHud.classList.toggle("is-collapsed", !on);
      madnessHud.classList.toggle("is-open", on);
    }
    if (madnessToggle) madnessToggle.setAttribute("aria-expanded", on ? "true" : "false");
    document.body.classList.toggle("madness-active", on);
    if (openDoorsBtn) openDoorsBtn.hidden = !on;
    if (on) toast("瘋狂模式開啟：噬魂 / 瘟疫 / 時間 / 電梯");
    else {
      closeDoorsUI();
      toast("瘋狂模式關閉：主體驗恢復安靜");
    }
  }

  if (madnessToggle) {
    madnessToggle.addEventListener("click", () => setMadness(!madnessOn));
  }

  // ——— 1. 噬魂（僅瘋狂模式） ———
  function spawnSoul(entry, real) {
    if (!soulLayer || !madnessOn) return;
    soulsStolen += 1;
    if (soulCountEl) soulCountEl.textContent = String(soulsStolen);

    const node = document.createElement("article");
    node.className = "soul-card" + (real ? " soul-card--real" : "");
    node.innerHTML =
      "<header>" +
      (real ? "噬魂成功 · 真實分頁" : "分頁幽靈") +
      "</header><strong></strong><p></p>";
    node.querySelector("strong").textContent = entry.title;
    node.querySelector("p").textContent = entry.line;
    node.style.left = 4 + Math.random() * 28 + "%";
    node.style.top = 22 + Math.random() * 50 + "%";
    soulLayer.appendChild(node);

    requestAnimationFrame(() => node.classList.add("is-in"));
    setTimeout(() => {
      node.classList.add("is-out");
      setTimeout(() => node.remove(), 700);
    }, 2600);

    if (channel) {
      channel.postMessage({
        type: "soul-ping",
        from: tabId,
        title: document.title,
        line: "有人正在把我的標題當靈魂抽走",
      });
    }
  }

  function onSoulScroll() {
    if (!madnessOn || emergency) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    const delta = Math.abs(y - lastSoulY);
    if (delta < 420) return;
    lastSoulY = y;

    const real = onSoulScroll._lastReal;
    if (real && Date.now() - real.at < 8000 && Math.random() > 0.4) {
      spawnSoul({ title: real.title, line: real.line }, true);
      onSoulScroll._lastReal = null;
      return;
    }
    spawnSoul(FAKE_TABS[Math.floor(Math.random() * FAKE_TABS.length)], false);
  }

  // ——— 2. 色卡瘟疫（僅瘋狂模式才廣播／接收） ———
  function showInfect(msg) {
    if (!infectBanner || !madnessOn) return;
    infectBanner.textContent = msg;
    infectBanner.hidden = false;
    infectBanner.classList.add("is-show");
    clearTimeout(showInfect._t);
    showInfect._t = setTimeout(() => {
      infectBanner.classList.remove("is-show");
      setTimeout(() => {
        infectBanner.hidden = true;
      }, 300);
    }, 2800);
  }

  window.addEventListener("cascade:palette", (e) => {
    const detail = e.detail || {};
    if (!madnessOn || detail.source === "infect") return;
    if (!channel || !detail.palette) return;
    showInfect("色卡瘟疫廣播中…");
    channel.postMessage({
      type: "infect",
      from: tabId,
      palette: detail.palette,
    });
  });

  // ——— 4. 時間買賣 ———
  function formatClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function updateTimeHud() {
    if (timeValue) timeValue.textContent = formatClock(secondsLeft);
    if (timeBought) timeBought.textContent = String(secondsBought);
    if (timeHud) {
      timeHud.classList.toggle("is-critical", secondsLeft <= 30);
      timeHud.classList.toggle("is-broke", secondsLeft <= 0);
    }
  }

  function onTimeScroll() {
    if (!madnessOn || emergency || secondsLeft <= 0) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!onTimeScroll._prev && onTimeScroll._prev !== 0) {
      onTimeScroll._prev = y;
      return;
    }
    const delta = Math.abs(y - onTimeScroll._prev);
    onTimeScroll._prev = y;
    scrollBucket += delta;
    while (scrollBucket >= 160 && secondsLeft > 0) {
      scrollBucket -= 160;
      secondsLeft -= 1;
      secondsBought += 1;
    }
    updateTimeHud();
    if (secondsLeft <= 0) {
      toast("時鐘售罄：你買下了 " + secondsBought + " 秒的未來");
      document.body.classList.add("time-sold-out");
    }
  }

  // ——— 5. 電梯樓層（安靜更新，不叮咚打擾主捲動） ———
  const FLOORS = [
    { id: "top", label: "L0 · 大廳" },
    { id: "chapters", label: "L1 · 敘事井" },
    { id: "rail", label: "L2 · 橫向軌道" },
    { id: "reveal", label: "B0 · 艙門前" },
  ];

  function updateFloor() {
    let current = FLOORS[0];
    const mid = window.innerHeight * 0.35;
    FLOORS.forEach((f) => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top <= mid) current = f;
    });
    if (current.label !== floor) {
      floor = current.label;
      if (floorLabel) floorLabel.textContent = floor;
      if (madnessOn && floorHud) {
        floorHud.classList.add("is-ping");
        setTimeout(() => floorHud.classList.remove("is-ping"), 450);
      }
    }
  }

  // ——— Konami 緊急停止（不鎖死主站：可點擊解除） ———
  function emergencyStop() {
    if (!madnessOn) {
      setMadness(true);
    }
    if (emergency) {
      releaseEmergency();
      return;
    }
    emergency = true;
    alarmBeep();
    demo() && demo().stopScroll();
    document.body.classList.add("is-emergency");
    if (alarmOverlay) {
      alarmOverlay.hidden = false;
      alarmOverlay.classList.add("is-show");
    }
    toast("緊急停止 · 再 Konami 一次或點畫面解除");
  }

  function releaseEmergency() {
    emergency = false;
    demo() && demo().startScroll();
    document.body.classList.remove("is-emergency");
    if (alarmOverlay) {
      alarmOverlay.classList.remove("is-show");
      setTimeout(() => {
        alarmOverlay.hidden = true;
      }, 300);
    }
    toast("緊急停止解除");
  }

  window.addEventListener("cascade:konami", emergencyStop);
  if (alarmOverlay) {
    alarmOverlay.addEventListener("click", releaseEmergency);
  }

  // ——— 重力合約：不鎖捲動，可略過 ———
  function openContract() {
    if (!contractModal || gravitySigned) return;
    contractModal.hidden = false;
    requestAnimationFrame(() => contractModal.classList.add("is-show"));
  }

  function closeContract() {
    if (!contractModal) return;
    contractModal.classList.remove("is-show");
    setTimeout(() => {
      contractModal.hidden = true;
    }, 300);
  }

  function checkOrientation(e) {
    const beta = e.beta;
    const upside =
      (typeof beta === "number" && Math.abs(beta) > 150) ||
      (typeof e.gamma === "number" && Math.abs(e.gamma) > 70 && Math.abs(beta) > 120);
    if (upside) markGravityOk();
  }

  function markGravityOk() {
    if (gravityOk) return;
    gravityOk = true;
    document.body.classList.add("gravity-honored");
    toast("重力合約生效");
    if (contractFlip) contractFlip.textContent = "已倒轉 ✓";
  }

  if (contractAccept) {
    contractAccept.addEventListener("click", () => {
      gravitySigned = true;
      document.body.classList.add("gravity-signed");
      closeContract();
      setMadness(true);
      toast("合約已簽。可倒轉裝置，或長按「倒轉」");
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", checkOrientation);
      }
    });
  }

  if (contractDismiss) {
    contractDismiss.addEventListener("click", () => {
      closeContract();
      toast("已略過合約 · 主體驗繼續");
    });
  }

  if (contractFlip) {
    let holdTimer = null;
    const startHold = () => {
      contractFlip.classList.add("is-holding");
      holdTimer = setTimeout(() => {
        document.body.classList.add("egg-flip");
        markGravityOk();
        setTimeout(() => document.body.classList.remove("egg-flip"), 1400);
      }, 1600);
    };
    const endHold = () => {
      contractFlip.classList.remove("is-holding");
      clearTimeout(holdTimer);
    };
    contractFlip.addEventListener("mousedown", startHold);
    contractFlip.addEventListener("mouseup", endHold);
    contractFlip.addEventListener("mouseleave", endHold);
    contractFlip.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        startHold();
      },
      { passive: false }
    );
    contractFlip.addEventListener("touchend", endHold);
  }

  window.addEventListener("cascade:eggs-complete", () => {
    setTimeout(openContract, 900);
  });

  // ——— 艙門：可隨時返回，不自動跳轉 ———
  function closeDoorsUI() {
    doorsOpened = false;
    if (blankExit) {
      blankExit.classList.remove("is-show");
      blankExit.hidden = true;
    }
    if (doorStage) {
      doorStage.classList.remove("is-open");
      doorStage.hidden = true;
    }
  }

  function openElevatorDoors() {
    if (doorsOpened || !doorStage || !madnessOn) return;
    if (document.body.classList.contains("egg-complete") && gravitySigned && !gravityOk) {
      toast("艙門拒絕：請先履行重力合約（或略過合約）");
      openContract();
      return;
    }
    doorsOpened = true;
    dingFloor();
    doorStage.hidden = false;
    requestAnimationFrame(() => doorStage.classList.add("is-open"));
    toast("艙門開啟 · 按「返回 CASCADE」即可回來");
    setTimeout(() => {
      if (!doorsOpened || !blankExit) return;
      blankExit.hidden = false;
      blankExit.classList.add("is-show");
    }, 900);
  }

  if (openDoorsBtn) openDoorsBtn.addEventListener("click", openElevatorDoors);

  if (blankExit) {
    const stay = blankExit.querySelector("[data-stay]");
    const leave = blankExit.querySelector("[data-leave]");
    if (stay) {
      stay.addEventListener("click", (e) => {
        e.stopPropagation();
        closeDoorsUI();
        toast("已返回網站");
      });
    }
    if (leave) {
      leave.addEventListener("click", (e) => {
        e.stopPropagation();
        closeDoorsUI();
        try {
          window.open("about:blank", "_blank");
        } catch (_) {
          /* ignore */
        }
        toast("已在新分頁打開 about:blank，本頁留下");
      });
    }
    blankExit.addEventListener("click", (e) => {
      if (e.target === blankExit) {
        closeDoorsUI();
        toast("已返回網站");
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && doorsOpened) {
      closeDoorsUI();
      toast("已返回網站");
    }
  });

  // 若重新整理前卡在艙門狀態，載入時強制清掉
  closeDoorsUI();

  const reveal = document.getElementById("reveal");
  if (reveal && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const note = document.getElementById("futureNote");
          if (!note) return;
          if (madnessOn && secondsBought > 0) {
            note.textContent =
              "瘋狂收據：買下 " + secondsBought + " 秒 · 噬魂 " + soulsStolen + " 枚";
          } else {
            note.textContent = "";
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(reveal);
  }

  if (channel) {
    channel.onmessage = (ev) => {
      const data = ev.data || {};
      if (data.from === tabId) return;

      if (data.type === "infect" && data.palette && demo()) {
        if (!madnessOn) return;
        demo().applyPalette(data.palette, { source: "infect" });
        showInfect("你被另一個分頁的色卡瘟疫感染了");
        document.body.classList.add("is-infected");
        setTimeout(() => document.body.classList.remove("is-infected"), 1200);
      }

      if (data.type === "soul-ping") {
        onSoulScroll._lastReal = {
          title: data.title || "未知分頁",
          line: data.line || "……",
          at: Date.now(),
        };
      }

      if (data.type === "hello" && madnessOn) {
        channel.postMessage({
          type: "soul-ping",
          from: tabId,
          title: document.title,
          line: "我在這棟電梯裡 · " + tabId,
        });
      }
    };
  }

  const shuffleBtn = document.getElementById("shufflePalette");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (!madnessOn || emergency) return;
      dingFloor();
    });
  }

  // 合約合約加「略過」按鈕若不存在則動態補上
  if (contractModal && !contractDismiss) {
    const actions = contractModal.querySelector(".contract-modal__actions");
    if (actions) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cta cta--ghost";
      btn.id = "contractDismiss";
      btn.textContent = "略過，繼續看";
      actions.appendChild(btn);
      btn.addEventListener("click", () => {
        closeContract();
        toast("已略過合約 · 主體驗繼續");
      });
    }
  }

  let ticking = false;
  function onScrollFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onSoulScroll();
      onTimeScroll();
      updateFloor();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScrollFrame, { passive: true });
  updateTimeHud();
  updateFloor();
})();
