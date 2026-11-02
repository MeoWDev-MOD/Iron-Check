// Página do Iron Check: notebook 3D que abre com a rolagem e navega pelo menu real do programa, seção de pixels em GLSL
// e rolagem suave. Monte com `npm run build` nesta pasta; o resultado vai para docs/js.
// Sem WebGL, ou com "reduzir movimento", a tela do programa continua navegável, só que plana e parada.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PAGES, CHIPS, NAV, TABS, SCREEN, LANG_BTN, BENCH, FLAGS } from "./data.js";

gsap.registerPlugin(ScrollTrigger);

const lang = document.documentElement.lang.startsWith("en") ? "en" : "pt";
const base = lang === "en" ? "../" : "";
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = Object.fromEntries(PAGES.map((p) => [p.id, p]));
const benchById = Object.fromEntries(BENCH.map((b) => [b.id, b]));
const t = (p, k) => p[k][lang];

// ---------- Rolagem suave ----------
let lenis = null;
if (!still) {
  lenis = new Lenis({ lerp: 0.12, anchors: { offset: -64 } });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---------- Tela do programa (HTML de verdade: nítida, clicável e acessível por teclado) ----------
const stage = document.getElementById("notebook");
const caption = stage?.querySelector(".nb-caption");
const chipsBox = stage?.querySelector(".nb-chips");
let screenEl = null;
let current = "sistema";
let benchTab = "render";
// O interruptor de bandeiras da tela troca o idioma do programa; o texto da página continua no idioma dela.
let screenLang = lang;
let stageVisible = true;

const shotOf = (id) => (id === "benchmark" && benchTab !== "render" ? `benchmark-${benchTab}` : id);
const imgUrl = (id, l = screenLang) => `${base}img/app/${l}/${shotOf(id)}.webp`;

const WAVE = '<svg width="0" height="0" style="position:absolute"><filter id="ic-wave" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="1" seed="7" result="t"><animate attributeName="baseFrequency" dur="1.3s" values="0.008 0.022;0.013 0.031;0.008 0.022" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';

function buildScreen() {
  const el = document.createElement("div");
  el.className = "ic-screen";
  el.style.width = `${SCREEN.w}px`;
  el.style.height = `${SCREEN.h}px`;
  el.innerHTML = `<img class="ic-a" alt="" width="${SCREEN.w}" height="${SCREEN.h}" src="${imgUrl("sistema")}"><img class="ic-b" alt="" width="${SCREEN.w}" height="${SCREEN.h}"><video class="ic-video" muted loop playsinline preload="none" disablepictureinpicture hidden></video><div class="ic-note" hidden></div><div class="ic-zones"></div><div class="ic-splash" aria-hidden="true">${WAVE}<div class="ic-card"><div class="ic-flag"></div><b class="ic-name"></b><span class="ic-sub"></span></div></div>`;
  return el;
}

function drawZones(id) {
  const zones = screenEl.querySelector(".ic-zones");
  zones.replaceChildren();
  const add = (r, label, go) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ic-zone";
    b.setAttribute("aria-label", label);
    b.title = label;
    Object.assign(b.style, { left: `${r[0]}px`, top: `${r[1]}px`, width: `${r[2]}px`, height: `${r[3]}px` });
    b.addEventListener("click", go);
    zones.append(b);
  };
  for (const tab of TABS) add(tab.r[screenLang], t(tab, "label"), () => show(tab.first));
  for (const item of NAV[byId[id].group] ?? []) add(item.r, byId[item.id] ? t(byId[item.id], "title") : item.id, () => show(item.id));
  add(LANG_BTN, lang === "en" ? "Switch the program language (Portuguese or English)" : "Trocar o idioma do programa (português ou inglês)", switchLang);
  if (id === "benchmark") for (const b of BENCH) add(b.r[screenLang], t(b, "label"), () => showBench(b.id));
}

function paintCaption() {
  if (!caption) return;
  const page = byId[current];
  const sub = current === "benchmark" ? benchById[benchTab] : null;
  caption.innerHTML = sub ? `<b>${t(page, "title")} · ${t(sub, "label")}</b> <span>${t(sub, "desc")}</span>` : `<b>${t(page, "title")}</b> <span>${t(page, "desc")}</span>`;
}

// Vídeo da animação do Benchmark, por cima do quadro da foto. Só baixa quando a sub-aba é aberta.
function setVideo() {
  const v = screenEl.querySelector(".ic-video");
  const sub = current === "benchmark" ? benchById[benchTab] : null;
  if (!sub) {
    v.hidden = true;
    v.pause();
    return;
  }
  const url = new URL(`${base}video/bench-${sub.video.replace("{lang}", screenLang)}.mp4`, location.href).href;
  Object.assign(v.style, { left: `${sub.v[0]}px`, top: `${sub.v[1]}px`, width: `${sub.v[2]}px`, height: `${sub.v[3]}px` });
  if (v.src !== url) v.src = url;
  v.hidden = false;
  syncVideo();
}
function syncVideo() {
  const v = screenEl?.querySelector(".ic-video");
  if (!v || v.hidden) return;
  const on = stageVisible && screenEl.style.visibility !== "hidden";
  if (on && v.paused) v.play().catch(() => {});
  else if (!on && !v.paused) v.pause();
}

function swapImage(url, alt, instant) {
  const a = screenEl.querySelector(".ic-a");
  const b = screenEl.querySelector(".ic-b");
  a.alt = alt;
  a.setAttribute("data-want", url);
  if (instant || still) {
    gsap.killTweensOf(b);
    gsap.set(b, { opacity: 0 });
    a.src = url;
    return;
  }
  const next = new Image();
  next.onload = () => {
    if (a.getAttribute("data-want") !== url) return; // outra tela foi pedida enquanto esta carregava
    b.src = next.src;
    gsap.killTweensOf(b);
    gsap.fromTo(b, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", onComplete: () => { a.src = next.src; gsap.set(b, { opacity: 0 }); } });
  };
  next.src = url;
}

function show(id, opts = {}) {
  const page = byId[id];
  if (!page || !screenEl) return;
  if (id === "benchmark" && current !== "benchmark") benchTab = "render";
  current = id;
  const note = screenEl.querySelector(".ic-note");
  drawZones(id);
  paintCaption();
  chipsBox?.querySelectorAll("button").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === id)));
  setVideo();
  if (page.noPhoto) {
    note.hidden = false;
    note.textContent = t(page, "desc");
    return;
  }
  note.hidden = true;
  swapImage(imgUrl(id), t(page, "title"), opts.instant);
}

function showBench(tab) {
  if (!benchById[tab]) return;
  benchTab = tab;
  show("benchmark");
}

// Troca de idioma com a mesma animação do programa: a bandeira ondulando por cima e o texto trocando por baixo.
let switching = false;
function switchLang() {
  if (switching) return;
  const to = screenLang === "en" ? "pt" : "en";
  if (still) {
    screenLang = to;
    show(current, { instant: true });
    return;
  }
  switching = true;
  new Image().src = imgUrl(current, to);
  const splash = screenEl.querySelector(".ic-splash");
  splash.querySelector(".ic-flag").innerHTML = FLAGS[to];
  splash.querySelector(".ic-name").textContent = to === "en" ? "English" : "Português";
  splash.querySelector(".ic-sub").textContent = to === "en" ? "United States" : "Brasil";
  screenEl.classList.remove("is-splash");
  void screenEl.offsetWidth;
  screenEl.classList.add("is-splash");
  setTimeout(() => {
    screenLang = to;
    show(current, { instant: true });
  }, 430);
  setTimeout(() => {
    screenEl.classList.remove("is-splash");
    switching = false;
  }, 1300);
}

function buildChips() {
  if (!chipsBox) return;
  for (const id of CHIPS) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.id = id;
    b.textContent = t(byId[id], "title");
    b.setAttribute("aria-pressed", String(id === current));
    b.addEventListener("click", () => {
      show(id);
      b.scrollIntoView({ block: "nearest", inline: "center" });
    });
    chipsBox.append(b);
  }
}

function flatScreen() {
  // Sem 3D: a mesma tela, deitada na página, dentro de uma moldura simples.
  stage.classList.add("is-flat");
  const holder = stage.querySelector(".nb-flat");
  const fit = () => {
    const k = holder.clientWidth / SCREEN.w;
    screenEl.style.transform = `scale(${k})`;
    holder.style.height = `${SCREEN.h * k}px`;
  };
  screenEl.style.visibility = "";
  screenEl.style.opacity = "";
  holder.append(screenEl);
  fit();
  addEventListener("resize", fit);
}

async function start3d() {
  // Carregado à parte: quem não vê o notebook não baixa o 3D.
  const { mountNotebook } = await import("./notebook.js");
  return mountNotebook({ stage, screenEl, lenis, gsap, ScrollTrigger });
}

if (stage) {
  screenEl = buildScreen();
  buildChips();
  show("sistema");
  const gl = (() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  })();
  if (still || !gl) flatScreen();
  else start3d().catch(() => flatScreen());
  new IntersectionObserver(([en]) => {
    stageVisible = en.isIntersecting;
    syncVideo();
  }).observe(stage);
}

// No celular, o botão do WhatsApp sairia por cima dos atalhos do notebook: ele some só enquanto o notebook está aberto.
// O vídeo do Benchmark para quando a tela apaga (tampa fechando) e volta quando ela acende.
const fab = document.querySelector(".fab");
if (stage) {
  const nav = stage.querySelector(".nb-nav");
  let lastVis = "";
  gsap.ticker.add(() => {
    if (screenEl && screenEl.style.visibility !== lastVis) {
      lastVis = screenEl.style.visibility;
      syncVideo();
    }
    if (!fab) return;
    const on = getComputedStyle(nav).visibility === "visible" && Number(getComputedStyle(nav).opacity) > 0.1 && stage.getBoundingClientRect().bottom > innerHeight * 0.6 && stage.getBoundingClientRect().top <= 0 && innerWidth < 760;
    fab.style.visibility = on ? "hidden" : "";
  });
}

// ---------- Pixels ----------
const pixels = document.getElementById("pixels");
if (pixels) {
  const swatches = [...pixels.querySelectorAll("[data-color]")];
  const rgb = (s) => s.split(",").map(Number);
  let setColor = () => {};
  swatches.forEach((b) =>
    b.addEventListener("click", () => {
      swatches.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      setColor(rgb(b.dataset.color));
    }),
  );
  import("./pixels.js")
    .then(({ mountPixels }) => {
      const api = mountPixels({ root: pixels, gsap, still });
      setColor = api.setColor;
      setColor(rgb(swatches.find((x) => x.getAttribute("aria-pressed") === "true")?.dataset.color ?? "255,255,255"));
    })
    .catch(() => pixels.classList.add("is-flat"));
}

// ---------- Entradas de seção: nada fica escondido sem script, porque só o script esconde ----------
if (!still) {
  document.querySelectorAll("main > section:not(.nb-stage):not(#pixels)").forEach((section) => {
    const parts = section.querySelectorAll("h2, .lead, .card, .group, .step, .plan, details, .paper, .shot, .compare tbody tr, .list li");
    if (!parts.length) return;
    gsap.set(parts, { opacity: 0, y: 22 });
    ScrollTrigger.batch(parts, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" }),
    });
  });
  addEventListener("load", () => ScrollTrigger.refresh());
}

// ---------- Interruptor de idioma ----------
const sw = document.getElementById("lang-sw");
sw?.addEventListener("click", (e) => {
  try {
    localStorage.setItem("ic-lang", sw.getAttribute("data-to"));
  } catch {
    /* sem armazenamento */
  }
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button || still) return;
  e.preventDefault();
  sw.classList.add("vai");
  setTimeout(() => (location.href = sw.getAttribute("href")), 380);
});
