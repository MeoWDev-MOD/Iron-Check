// Notebook 3D (Three.js): modelo próprio, com a logo do gato na tampa. A tela é o HTML de main.js, colado na tampa
// pelo CSS3DRenderer. A rolagem (GSAP ScrollTrigger) abre a tampa e leva a câmera até a tela.
import { ACESFilmicToneMapping, CanvasTexture, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster, RawShaderMaterial, Scene, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { SCREEN } from "./data.js";

const WIDTH = 3.3;
const DEPTH = 2.24;
const SCREEN_W = 3.02;
const SCREEN_H = SCREEN_W * (SCREEN.h / SCREEN.w);
const LID_H = SCREEN_H + 0.2;
const CLOSED = Math.PI / 2 - 0.012;
const OPEN = -0.13;

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
  // A tela acesa ilumina o ambiente quando a tampa abre.
  float glow=exp(-3.2*length((vUv-vec2(.5,.56))*vec2(1.1,1.5)));
  c+=vec3(.42,.27,.86)*glow*.42*uOpen;
  gl_FragColor=vec4(c,1.);
}`;

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

export function mountNotebook({ stage, screenEl, lenis, gsap, ScrollTrigger }) {
  const pin = stage.querySelector(".nb-pin");
  const canvas = stage.querySelector(".nb-gl");
  const cssHost = stage.querySelector(".nb-css");

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
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

  const metal = new MeshStandardMaterial({ color: 0x3a2f5c, metalness: 0.92, roughness: 0.34 });
  const dark = new MeshStandardMaterial({ color: 0x0c0818, metalness: 0.4, roughness: 0.7 });
  const keyMat = new MeshStandardMaterial({ color: 0x151024, metalness: 0.2, roughness: 0.62 });

  const laptop = new Group();
  scene.add(laptop);

  const shadow = new Mesh(new PlaneGeometry(WIDTH * 1.7, DEPTH * 1.75), new MeshBasicMaterial({ map: softShadow(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.052;
  laptop.add(shadow);

  // Base.
  const base = new Mesh(new RoundedBoxGeometry(WIDTH, 0.1, DEPTH, 6, 0.045), metal);
  laptop.add(base);
  const deck = new Mesh(new RoundedBoxGeometry(WIDTH - 0.5, 0.004, 1.02, 2, 0.002), dark);
  deck.position.set(0, 0.051, -0.42);
  laptop.add(deck);
  const pad = new Mesh(new RoundedBoxGeometry(1.25, 0.004, 0.72, 3, 0.002), new MeshStandardMaterial({ color: 0x4a3d72, metalness: 0.85, roughness: 0.28 }));
  pad.position.set(0, 0.051, 0.58);
  laptop.add(pad);

  // Teclado: uma peça só repetida, para pesar pouco.
  const rows = [14, 14, 13, 12, 9];
  const count = rows.reduce((a, b) => a + b, 0);
  const keys = new InstancedMesh(new RoundedBoxGeometry(1, 0.02, 1, 2, 0.008), keyMat, count);
  const dummy = new Object3D();
  let k = 0;
  rows.forEach((n, r) => {
    const w = (WIDTH - 0.66) / n;
    for (let i = 0; i < n; i++) {
      const bar = r === 4 && i === 4;
      dummy.position.set(-(WIDTH - 0.66) / 2 + w * (i + 0.5), 0.06, -0.8 + r * 0.19);
      dummy.scale.set((bar ? 1.0 : 0.86) * w, 1, 0.155);
      dummy.updateMatrix();
      keys.setMatrixAt(k++, dummy.matrix);
    }
  });
  laptop.add(keys);

  // Tampa: dobradiça na beirada de trás.
  const hinge = new Group();
  hinge.position.set(0, 0.055, -DEPTH / 2 + 0.045);
  laptop.add(hinge);
  const lid = new Mesh(new RoundedBoxGeometry(WIDTH, LID_H, 0.05, 6, 0.024), metal);
  lid.position.y = LID_H / 2;
  hinge.add(lid);
  const bezel = new Mesh(new PlaneGeometry(WIDTH - 0.05, LID_H - 0.05), new MeshBasicMaterial({ color: 0x05030c }));
  bezel.position.set(0, LID_H / 2, 0.0262);
  hinge.add(bezel);
  const panel = new Mesh(new PlaneGeometry(SCREEN_W, SCREEN_H), new MeshBasicMaterial({ color: 0x130a2e }));
  panel.position.set(0, LID_H / 2, 0.0268);
  hinge.add(panel);

  // Logo do gato no lado de fora da tampa.
  const logoBase = document.documentElement.lang.startsWith("en") ? "../" : "";
  const logoTex = new TextureLoader().load(`${logoBase}img/logo.png`);
  logoTex.colorSpace = SRGBColorSpace;
  const logo = new Mesh(new PlaneGeometry(0.86, 0.86), new MeshBasicMaterial({ map: logoTex, transparent: true, side: DoubleSide, depthWrite: false }));
  logo.position.set(0, LID_H / 2, -0.0262);
  logo.rotation.set(0, Math.PI, Math.PI); // lida de frente com a tampa fechada, como aparece no topo da página
  hinge.add(logo);

  // Tela de HTML colada na tampa.
  const cssRenderer = new CSS3DRenderer({ element: cssHost });
  const cssScene = new Scene();
  const cssHinge = new Group();
  cssHinge.position.copy(hinge.position);
  cssScene.add(cssHinge);
  const screenObject = new CSS3DObject(screenEl);
  screenObject.position.set(0, LID_H / 2, 0.0275);
  screenObject.scale.setScalar(SCREEN_W / SCREEN.w);
  cssHinge.add(screenObject);
  screenEl.style.backfaceVisibility = "hidden";

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
    const copyEl = stage.querySelector('.nb-copy');
    const below = copyEl.offsetTop + copyEl.offsetHeight;
    const dist = from.pos.length();
    const offset = (((below + h) / 2 - h / 2) / h) * 2 * tan * dist;
    from.look.set(0, offset * 0.86, 0);
    // Aberto: a tela ocupa o que sobra acima da legenda e dos botões.
    const screenZ = hinge.position.z + Math.sin(-OPEN) * -(LID_H / 2);
    // Altura livre: a barra do topo e a faixa de botões ficam fora da conta.
    const free = Math.max(0.35, (h - 66 - navH()) / h);
    const fit = Math.max((LID_H * 1.04) / (2 * tan * free), (WIDTH * 1.04) / (2 * tan * camera.aspect));
    const cy = hinge.position.y + Math.cos(OPEN) * (LID_H / 2);
    to.pos.set(0, cy + 0.06, screenZ + fit);
    // Centro da área livre, acima do meio da janela por causa da faixa de baixo.
    const shift = ((navH() - 66) / 2 / h) * 2 * tan * fit;
    to.pos.y = cy;
    to.look.set(0, cy - shift, screenZ);
  }
  layout();
  addEventListener("resize", layout);

  function draw(time) {
    const lidAngle = CLOSED + (OPEN - CLOSED) * state.open;
    hinge.rotation.x = lidAngle;
    cssHinge.rotation.x = lidAngle;
    backdrop.uniforms.uTime.value = time;
    backdrop.uniforms.uOpen.value = state.open;
    camera.position.lerpVectors(from.pos, to.pos, state.cam);
    look.lerpVectors(from.look, to.look, state.cam);
    camera.lookAt(look);
    screenObject.visible = state.open > 0.06;
    screenEl.style.visibility = state.open > 0.06 ? "visible" : "hidden";
    screenEl.toggleAttribute("inert", state.open < 0.9);
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
