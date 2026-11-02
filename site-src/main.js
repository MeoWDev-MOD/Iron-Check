// Página do Iron Check: notebook 3D que abre com a rolagem e navega pelo menu real do programa, seção de pixels em GLSL
// e rolagem suave. Monte com `npm run build` nesta pasta; o resultado vai para docs/js/site.js.
// Sem WebGL, ou com "reduzir movimento", a tela do programa continua navegável, só que plana e parada.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PAGES, CHIPS, NAV, TABS, SCREEN } from "./data.js";

gsap.registerPlugin(ScrollTrigger);

const lang = document.documentElement.lang.startsWith("en") ? "en" : "pt";
const base = lang === "en" ? "../" : "";
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = Object.fromEntries(PAGES.map((p) => [p.id, p]));
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

function imgUrl(id) {
  return `${base}img/app/${lang}/${id}.webp`;
}

function buildScreen() {
  const el = document.createElement("div");
  el.className = "ic-screen";
  el.style.width = `${SCREEN.w}px`;
  el.style.height = `${SCREEN.h}px`;
  el.innerHTML = `<img class="ic-a" alt="" width="${SCREEN.w}" height="${SCREEN.h}" src="${imgUrl("sistema")}"><img class="ic-b" alt="" width="${SCREEN.w}" height="${SCREEN.h}"><div class="ic-note" hidden></div><div class="ic-zones"></div>`;
  return el;
}

function drawZones(id) {
  const zones = screenEl.querySelector(".ic-zones");
  const group = byId[id].group;
  zones.replaceChildren();
  const add = (r, label, go, cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("aria-label", label);
    b.title = label;
    Object.assign(b.style, { left: `${r[0]}px`, top: `${r[1]}px`, width: `${r[2]}px`, height: `${r[3]}px` });
    b.addEventListener("click", () => show(go));
    zones.append(b);
  };
  for (const tab of TABS) add(tab.r, t(tab, "label"), tab.first, "ic-zone");
  for (const item of NAV[group] ?? []) add(item.r, byId[item.id] ? t(byId[item.id], "title") : item.id, item.id, "ic-zone");
}

function show(id) {
  const page = byId[id];
  if (!page || !screenEl) return;
  current = id;
  const a = screenEl.querySelector(".ic-a");
  const b = screenEl.querySelector(".ic-b");
  const note = screenEl.querySelector(".ic-note");
  drawZones(id);
  if (caption) caption.innerHTML = `<b>${t(page, "title")}</b> <span>${t(page, "desc")}</span>`;
  chipsBox?.querySelectorAll("button").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === id)));
  if (page.noPhoto) {
    note.hidden = false;
    note.textContent = t(page, "desc");
    return;
  }
  note.hidden = true;
  a.alt = t(page, "title");
  const next = new Image();
  next.onload = () => {
    if (current !== id) return;
    b.src = next.src;
    if (still) {
      a.src = next.src;
      return;
    }
    gsap.killTweensOf(b);
    gsap.fromTo(b, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", onComplete: () => { a.src = next.src; gsap.set(b, { opacity: 0 }); } });
  };
  next.src = imgUrl(id);
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
}

// No celular, o botão do WhatsApp sairia por cima dos atalhos do notebook: ele some só enquanto o notebook está aberto.
const fab = document.querySelector('.fab');
if (stage && fab) {
  const nav = stage.querySelector('.nb-nav');
  gsap.ticker.add(() => {
    const on = getComputedStyle(nav).visibility === 'visible' && Number(getComputedStyle(nav).opacity) > 0.1 && stage.getBoundingClientRect().bottom > innerHeight * 0.6 && stage.getBoundingClientRect().top <= 0 && innerWidth < 760;
    fab.style.visibility = on ? 'hidden' : '';
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
