// Notebook 3D (Three.js) no estilo dos notebooks finos de alumínio: grafite escuro, vidro preto de ponta a ponta com a
// câmera num entalhe no alto da tela, teclado preto com as legendas, alto-falantes dos lados e touchpad grande. Sem marca
// de terceiros: a tampa leva a logo do gato. A tela é o HTML de main.js, colado na tampa pelo CSS3DRenderer.
// O CSS 3D é desenhado por cima do WebGL: se ficasse sempre visível, o programa apareceria através da tampa, de cabeça
// para baixo, enquanto ela abre. Por isso a tela só acende quando está virada para quem olha.
import {
  ACESFilmicToneMapping, BackSide, BoxGeometry, CanvasTexture, CircleGeometry, Color, DoubleSide, ExtrudeGeometry, Group, InstancedMesh,
  Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster, RawShaderMaterial,
  Scene, Shape, ShapeGeometry, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { SCREEN } from "./data.js";

// Medidas de um notebook de 14 polegadas, em milímetros, na escala da cena.
const MM = 3.3 / 312.6;
const WIDTH = 312.6 * MM;
const DEPTH = 221.2 * MM;
const BASE_H = 9.4 * MM;
const LID_T = 5.6 * MM;
const RIM = 4.6 * MM; // vidro preto dos lados e acima da tela
const CHIN = 9.5 * MM; // vidro abaixo da tela
const DISPLAY_W = WIDTH - 2 * RIM;
const DISPLAY_H = DISPLAY_W / 1.54; // tela alta: a faixa de cima fica para a câmera
const CONTENT_H = DISPLAY_W * (SCREEN.h / SCREEN.w); // o programa (16:10) ocupa a tela abaixo da faixa
const NOTCH_W = 0.3;
const NOTCH_H = (DISPLAY_H - CONTENT_H) * 0.84;
const LID_H = CHIN + DISPLAY_H + RIM;
const FRONT = LID_T / 2; // face de dentro da tampa
const KEY_H = 0.012;
const HINGE = new Vector3(0, BASE_H + KEY_H + 0.004 + LID_T / 2, -DEPTH / 2 + 7.5 * MM);
const CLOSED = Math.PI / 2 - 0.003;
const OPEN = -0.15;
const U = 0.2; // passo das teclas
const KB_Z = -DEPTH / 2 + 0.19; // começo do teclado (fileira das teclas F)
const BAND = new Color("#130a2e"); // fundo do programa: a faixa da câmera acende na mesma cor
const BLACK = new Color(0x000000);
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const BACKDROP = /* glsl */ `
precision highp float;
uniform float uTime; uniform vec2 uRes; uniform float uOpen;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+7.;a*=.5;}return v;}
void main(){
  vec2 p=vUv*vec2(uRes.x/uRes.y,1.)*2.2;
  float t=uTime*.035;
  float n=fbm(p+1.8*vec2(fbm(p+t),fbm(p-t+4.)));
  vec3 g=vec3(.075,.039,.18), a=vec3(.204,.067,.494), b=vec3(.286,.102,.694);
  vec3 c=mix(g,a,smoothstep(.34,.8,n)*(.55+.45*vUv.y));
  c=mix(c,b,smoothstep(.62,.95,n)*.55);
  // A tela acesa ilumina o ambiente.
  float glow=exp(-3.2*length((vUv-vec2(.5,.56))*vec2(1.1,1.5)));
  c+=vec3(.42,.27,.86)*glow*.42*uOpen;
  gl_FragColor=vec4(c,1.);
}`;

// Teclado em inglês (como o dos notebooks da foto): legenda, largura em teclas e o tipo de legenda.
const ROW_F = [["esc", 1.5, "l"], ..."F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12".split(" ").map((k) => [k, 1, "f"]), ["", 1, "id"]];
const KEYS = [
  ROW_F,
  [["~\n`"], ["!\n1"], ["@\n2"], ["#\n3"], ["$\n4"], ["%\n5"], ["^\n6"], ["&\n7"], ["*\n8"], ["(\n9"], [")\n0"], ["_\n-"], ["+\n="], ["delete", 1.5, "r"]],
  [["tab", 1.5, "l"], ..."QWERTYUIOP".split("").map((k) => [k]), ["{\n["], ["}\n]"], ["|\n\\"]],
  [["caps lock", 1.8, "l"], ..."ASDFGHJKL".split("").map((k) => [k]), [":\n;"], ['"\n\''], ["return", 1.7, "r"]],
  [["shift", 2.3, "l"], ..."ZXCVBNM".split("").map((k) => [k]), ["<\n,"], [">\n."], ["?\n/"], ["shift", 2.2, "r"]],
  [["fn", 1, "l"], ["control", 1, "l"], ["option", 1, "l"], ["command", 1.25, "l"], ["", 5], ["command", 1.25, "r"], ["option", 1, "r"], ["◀", 1, "lo"], ["▲\n▼", 1, "ud"], ["▶", 1, "lo"]],
];
const SYMBOL = { command: "⌘", option: "⌥", control: "⌃" };

function rounded(w, h, r, rb = r) {
  const s = new Shape();
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  s.moveTo(x0 + rb, y0);
  s.lineTo(x1 - rb, y0);
  s.absarc(x1 - rb, y0 + rb, rb, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + rb);
  s.absarc(x0 + rb, y0 + rb, rb, Math.PI, Math.PI * 1.5, false);
  return s;
}

// Placa de cantos redondos com as quinas suavizadas, centrada na espessura.
function slab(w, h, t, r, bevel) {
  const g = new ExtrudeGeometry(rounded(w - 2 * bevel, h - 2 * bevel, r - bevel), { depth: t - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 18 });
  g.translate(0, 0, -(t / 2 - bevel));
  return g;
}

// Peça fina deitada sobre a base.
function onDeck(geo, mat, x, y, z) {
  const m = new Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}
const decal = (m) => Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });

function softShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "rgba(3,0,14,.85)");
  g.addColorStop(1, "rgba(3,0,14,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

// Estúdio para os reflexos: luz branca em cima e painéis roxos dos lados, que acendem as quinas do alumínio.
function studio(renderer) {
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(30, 30, 30), new MeshBasicMaterial({ color: 0x07050d, side: BackSide })));
  const light = (w, h, hex, k, x, y, z) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(k), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  light(12, 4, 0xffffff, 2.4, 0, 12, 3);
  light(18, 7, 0xd9d0ff, 1.5, 0, 8, -11); // atrás e acima: é o reflexo que aparece na tampa vista de frente
  light(5, 10, 0x7b45f0, 3.2, -12, 3, 1);
  light(5, 10, 0xa981ff, 2.2, 12, 4, -3);
  light(14, 1.6, 0xd0bcfc, 1.6, 0, 3, 13);
  return new PMREMGenerator(renderer).fromScene(env, 0.02).texture;
}

function legendTexture(renderer) {
  const PX = 140;
  const c = document.createElement("canvas");
  c.width = 14.5 * PX;
  c.height = 6 * PX;
  const x = c.getContext("2d");
  const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
  x.fillStyle = x.strokeStyle = "rgba(236,236,244,.86)";
  x.textBaseline = "middle";
  KEYS.forEach((row, r) => {
    let k = 0;
    for (const [label, w = 1, kind = ""] of row) {
      const x0 = (k + 0.08) * PX, y0 = (r + 0.08) * PX, cw = (w - 0.16) * PX, ch = 0.84 * PX;
      const text = (s, size, tx, ty, align = "center") => {
        x.font = `500 ${PX * size}px ${FONT}`;
        x.textAlign = align;
        x.fillText(s, tx, ty);
      };
      if (kind === "id") {
        x.lineWidth = 3;
        x.beginPath();
        x.arc(x0 + cw / 2, y0 + ch / 2, ch * 0.3, 0, Math.PI * 2);
        x.stroke();
      } else if (kind === "f") text(label, 0.15, x0 + cw / 2, y0 + ch * 0.78);
      else if (kind === "l" || kind === "r") {
        const left = kind === "l";
        text(label, 0.15, left ? x0 + PX * 0.1 : x0 + cw - PX * 0.1, y0 + ch * 0.78, left ? "left" : "right");
        if (SYMBOL[label]) text(SYMBOL[label], 0.17, left ? x0 + cw - PX * 0.12 : x0 + PX * 0.12, y0 + ch * 0.24, left ? "right" : "left");
      } else if (kind === "lo") text(label, 0.16, x0 + cw / 2, y0 + ch * 0.76);
      else if (kind === "ud") {
        const [a, b] = label.split("\n");
        text(a, 0.13, x0 + cw / 2, y0 + ch * 0.25);
        text(b, 0.13, x0 + cw / 2, y0 + ch * 0.76);
      } else if (label.includes("\n")) {
        const [a, b] = label.split("\n");
        text(a, 0.2, x0 + cw / 2, y0 + ch * 0.32);
        text(b, 0.2, x0 + cw / 2, y0 + ch * 0.68);
      } else if (label) text(label, 0.26, x0 + cw / 2, y0 + ch / 2);
      k += w;
    }
  });
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function grilleTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(0,0,0,.8)";
  for (let y = 4, i = 0; y < 512; y += 7, i++) {
    for (let px = i % 2 ? 6 : 9.5; px < 64; px += 7) {
      x.beginPath();
      x.arc(px, y, 1.7, 0, Math.PI * 2);
      x.fill();
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function keyboard(keyMat) {
  const caps = [];
  KEYS.forEach((row, r) => {
    let k = 0;
    for (const [, w = 1, kind = ""] of row) {
      const cx = k + w / 2, cz = r + 0.5;
      if (kind === "ud") caps.push([cx, cz - 0.25, w, 0.5], [cx, cz + 0.25, w, 0.5]);
      else if (kind === "lo") caps.push([cx, cz + 0.25, w, 0.5]);
      else caps.push([cx, cz, w, 1]);
      k += w;
    }
  });
  const keys = new InstancedMesh(new RoundedBoxGeometry(1, KEY_H, 1, 2, 0.004), keyMat, caps.length);
  const d = new Object3D();
  caps.forEach(([cx, cz, w, h], i) => {
    d.position.set((cx - 7.25) * U, BASE_H + KEY_H / 2, KB_Z + cz * U);
    d.scale.set((w - 0.16) * U, 1, (h - (h < 1 ? 0.1 : 0.16)) * U);
    d.updateMatrix();
    keys.setMatrixAt(i, d.matrix);
  });
  return keys;
}

export function mountNotebook({ stage, screenEl, lenis, gsap, ScrollTrigger }) {
  const pin = stage.querySelector(".nb-pin");
  const canvas = stage.querySelector(".nb-gl");
  const cssHost = stage.querySelector(".nb-css");

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.environment = studio(renderer);
  scene.environmentIntensity = 1.3;
  const camera = new PerspectiveCamera(34, 1, 0.1, 60);

  // Fundo em GLSL, desenhado antes de tudo e fora da câmera.
  const backdrop = new RawShaderMaterial({
    vertexShader: "attribute vec3 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}",
    fragmentShader: BACKDROP,
    uniforms: { uTime: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uOpen: { value: 0 } },
    depthTest: false,
    depthWrite: false,
  });
  const bgMesh = new Mesh(new PlaneGeometry(2, 2), backdrop);
  bgMesh.frustumCulled = false;
  bgMesh.renderOrder = -10;
  scene.add(bgMesh);

  // Alumínio anodizado escuro: a camada de óxido reflete como verniz, não como metal polido (metal escuro sairia preto).
  const alu = new MeshPhysicalMaterial({ color: 0x3d3b46, metalness: 0.3, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.25 });
  const glass = new MeshStandardMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.08 });
  const keyMat = new MeshStandardMaterial({ color: 0x0c0c0f, metalness: 0.15, roughness: 0.55 });
  const hingeMat = new MeshStandardMaterial({ color: 0x0d0d10, metalness: 0.5, roughness: 0.45 });
  const wellMat = decal(new MeshStandardMaterial({ color: 0x08080a, metalness: 0.3, roughness: 0.75 }));
  const padMat = decal(new MeshPhysicalMaterial({ color: 0x3a3842, metalness: 0.1, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.15 }));

  const laptop = new Group();
  scene.add(laptop);

  const shadow = new Mesh(new PlaneGeometry(WIDTH * 1.7, DEPTH * 1.75), new MeshBasicMaterial({ map: softShadow(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.002;
  laptop.add(shadow);

  // Base: alumínio, teclado num poço preto, alto-falantes dos lados e touchpad de vidro.
  const base = new Mesh(slab(WIDTH, DEPTH, BASE_H, 0.11, 0.014), alu);
  base.rotation.x = -Math.PI / 2;
  base.position.y = BASE_H / 2;
  laptop.add(base);
  const deckY = BASE_H + 0.0005;
  laptop.add(onDeck(new ShapeGeometry(rounded(14.5 * U + 0.05, 6 * U + 0.05, 0.03), 8), wellMat, 0, deckY, KB_Z + 3 * U));
  const grille = decal(new MeshBasicMaterial({ map: grilleTexture(), transparent: true, depthWrite: false }));
  for (const side of [-1, 1]) laptop.add(onDeck(new PlaneGeometry(0.1, 6 * U - 0.04), grille, side * (7.25 * U + 0.1), deckY, KB_Z + 3 * U));
  laptop.add(onDeck(new ShapeGeometry(rounded(1.37, 0.78, 0.035), 12), padMat, 0, deckY + 0.0002, KB_Z + 6 * U + 0.1 + 0.39));
  laptop.add(keyboard(keyMat));
  const legend = new Mesh(new PlaneGeometry(14.5 * U, 6 * U), new MeshBasicMaterial({ map: legendTexture(renderer), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.6 }));
  legend.rotation.x = -Math.PI / 2;
  legend.position.set(0, BASE_H + KEY_H + 0.0008, KB_Z + 3 * U);
  laptop.add(legend);
  const barrel = new Mesh(new RoundedBoxGeometry(WIDTH - 0.62, 0.07, 0.075, 4, 0.034), hingeMat);
  barrel.position.set(0, HINGE.y - 0.012, HINGE.z);
  laptop.add(barrel);

  // Tampa: dobradiça na beirada de trás. Vidro preto na frente, tela com a faixa da câmera, logo do gato atrás.
  const hinge = new Group();
  hinge.position.copy(HINGE);
  laptop.add(hinge);
  const lid = new Mesh(slab(WIDTH, LID_H, LID_T, 0.11, 0.012), alu);
  lid.position.y = LID_H / 2;
  hinge.add(lid);
  const glassMesh = new Mesh(new ShapeGeometry(rounded(WIDTH - 0.03, LID_H - 0.03, 0.096), 24), glass);
  glassMesh.position.set(0, LID_H / 2, FRONT + 0.0005);
  hinge.add(glassMesh);
  const panel = new Mesh(new ShapeGeometry(rounded(DISPLAY_W, DISPLAY_H, 0.06, 0.014), 20), new MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
  panel.position.set(0, CHIN + DISPLAY_H / 2, FRONT + 0.001);
  hinge.add(panel);
  const notchY = CHIN + DISPLAY_H - NOTCH_H / 2;
  const notch = new Mesh(new ShapeGeometry(rounded(NOTCH_W, NOTCH_H, 0.001, 0.024), 10), new MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
  notch.position.set(0, notchY, FRONT + 0.0015);
  hinge.add(notch);
  const lens = new Mesh(new CircleGeometry(0.0105, 20), new MeshBasicMaterial({ color: 0x0c0f22, toneMapped: false }));
  lens.position.set(0, notchY, FRONT + 0.002);
  hinge.add(lens);
  const glint = new Mesh(new CircleGeometry(0.0032, 12), new MeshBasicMaterial({ color: 0x3a3f7a, toneMapped: false }));
  glint.position.set(0.003, notchY + 0.003, FRONT + 0.0025);
  hinge.add(glint);

  const logoBase = document.documentElement.lang.startsWith("en") ? "../" : "";
  const logoTex = new TextureLoader().load(`${logoBase}img/logo.png`);
  logoTex.colorSpace = SRGBColorSpace;
  const logo = new Mesh(new PlaneGeometry(0.7, 0.7), new MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false }));
  logo.position.set(0, LID_H / 2, -FRONT - 0.0006);
  logo.rotation.set(0, Math.PI, Math.PI); // lida de frente com a tampa fechada, como aparece no topo da página
  hinge.add(logo);

  // Tela de HTML colada na tampa, abaixo da faixa da câmera.
  const cssRenderer = new CSS3DRenderer({ element: cssHost });
  const cssScene = new Scene();
  const cssHinge = new Group();
  cssHinge.position.copy(HINGE);
  cssScene.add(cssHinge);
  const screenObject = new CSS3DObject(screenEl);
  screenObject.position.set(0, CHIN + CONTENT_H / 2, FRONT + 0.0022);
  screenObject.scale.setScalar(DISPLAY_W / SCREEN.w);
  cssHinge.add(screenObject);

  // Onde fica a tela com a tampa aberta: a câmera termina de frente para ela.
  const probe = new Object3D();
  probe.position.copy(HINGE);
  probe.rotation.x = OPEN;
  probe.updateMatrixWorld();
  const openCenter = new Vector3(0, CHIN + DISPLAY_H / 2, FRONT).applyMatrix4(probe.matrixWorld);
  const openNormal = new Vector3(0, 0, 1).transformDirection(probe.matrixWorld);
  const openUp = new Vector3(0, 1, 0).transformDirection(probe.matrixWorld);

  // Estado animado pela rolagem.
  const state = { open: 0, cam: 0 };
  const from = { pos: new Vector3(), look: new Vector3() };
  const to = { pos: new Vector3(), look: new Vector3() };
  const look = new Vector3();

  const navH = () => stage.querySelector(".nb-nav").offsetHeight;

  function layout() {
    const w = pin.clientWidth;
    const h = pin.clientHeight;
    renderer.setSize(w, h, false);
    cssRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    backdrop.uniforms.uRes.value.set(w, h);
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    // Fechado: pequeno, na metade de baixo, abaixo do título.
    const far = Math.max(7.4, (WIDTH * 1.5) / (2 * tan * camera.aspect));
    from.pos.set(0, far * 0.62, far * 0.78);
    // Centro do notebook no espaço livre abaixo do texto: olhar acima do centro desce o notebook na janela.
    const copyEl = stage.querySelector(".nb-copy");
    const below = copyEl.offsetTop + copyEl.offsetHeight;
    const dist = from.pos.length();
    const offset = (((below + h) / 2 - h / 2) / h) * 2 * tan * dist;
    from.look.set(0, offset * 0.86, 0);
    // Aberto: a tampa de frente, no que sobra acima da legenda e dos botões (a barra do topo também fica fora).
    const free = Math.max(0.35, (h - 66 - navH()) / h);
    const fit = Math.max((LID_H * 1.04) / (2 * tan * free), (WIDTH * 1.04) / (2 * tan * camera.aspect));
    const shift = ((navH() - 66) / 2 / h) * 2 * tan * fit;
    to.look.copy(openCenter).addScaledVector(openUp, -shift);
    to.pos.copy(to.look).addScaledVector(openNormal, fit);
  }
  layout();
  addEventListener("resize", layout);

  const center = new Vector3();
  const normal = new Vector3();
  const toCam = new Vector3();
  let lastOn = -1;
  function draw(time) {
    const angle = CLOSED + (OPEN - CLOSED) * state.open;
    hinge.rotation.x = angle;
    cssHinge.rotation.x = angle;
    camera.position.lerpVectors(from.pos, to.pos, state.cam);
    look.lerpVectors(from.look, to.look, state.cam);
    camera.lookAt(look);
    // Quanto a tela está virada para a câmera: de costas (ou de quina) ela fica apagada.
    hinge.updateMatrixWorld();
    center.set(0, CHIN + DISPLAY_H / 2, FRONT).applyMatrix4(hinge.matrixWorld);
    normal.set(0, 0, 1).transformDirection(hinge.matrixWorld);
    const on = smooth(0.22, 0.62, normal.dot(toCam.subVectors(camera.position, center).normalize()));
    if (Math.abs(on - lastOn) > 0.003 || (on === 0) !== (lastOn === 0)) {
      lastOn = on;
      screenObject.visible = on > 0.01;
      screenEl.style.visibility = on > 0.01 ? "visible" : "hidden";
      screenEl.style.opacity = on > 0.997 ? "" : on.toFixed(3);
    }
    panel.material.color.copy(BLACK).lerp(BAND, on);
    screenEl.toggleAttribute("inert", on < 0.9);
    backdrop.uniforms.uTime.value = time;
    backdrop.uniforms.uOpen.value = on;
    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
  }

  // Rolagem: abre a tampa, tira o título e traz a legenda.
  const copy = stage.querySelector(".nb-copy");
  const nav = stage.querySelector(".nb-nav");
  gsap.set(nav, { autoAlpha: 0, y: 18 });
  const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
  tl.to(copy, { autoAlpha: 0, y: -40, duration: 0.14 }, 0.02)
    .to(state, { open: 1, duration: 0.5, ease: "power2.inOut" }, 0.04)
    .to(state, { cam: 1, duration: 0.56, ease: "power2.inOut" }, 0)
    .to(nav, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.52)
    .to({}, { duration: 0.44 });

  // Clicar no notebook fechado abre: rola até o ponto em que a tela está pronta.
  const ray = new Raycaster();
  const pointer = new Vector2();
  function overLaptop(e) {
    const box = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects([base, lid], false).length > 0;
  }
  function openNow() {
    const y = tl.scrollTrigger.start + (tl.scrollTrigger.end - tl.scrollTrigger.start) * 0.62;
    if (lenis) lenis.scrollTo(y, { duration: 1.5 });
    else scrollTo({ top: y, behavior: "smooth" });
  }
  pin.addEventListener("click", (e) => {
    if (state.open < 0.5 && !e.target.closest("a,button") && overLaptop(e)) openNow();
  });
  pin.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pin.style.cursor = state.open < 0.5 && !e.target.closest("a,button") && overLaptop(e) ? "pointer" : "";
  });
  stage.querySelector(".nb-open")?.addEventListener("click", openNow);

  // Só desenha com o notebook na tela.
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting), { rootMargin: "10% 0px" }).observe(pin);
  gsap.ticker.add((time) => {
    if (visible && !document.hidden) draw(time);
  });
  draw(0);
  stage.classList.add("is-3d");
  ScrollTrigger.refresh();
}
