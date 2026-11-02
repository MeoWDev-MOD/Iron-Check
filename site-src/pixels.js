// Seção de pixels, no estilo da página de telas da Apple: um painel em GLSL com os subpixels R, G e B de cada pixel.
// Os pixels ficam apagados e acendem onde o mouse (ou o dedo) passa, com um rastro que se apaga sozinho. Um pixel é
// morto e nunca acende; com o preto escolhido aparece um pixel travado (o verde sempre aceso). São os defeitos que o
// teste de tela do Iron Check mostra. A rolagem aproxima o painel até os subpixels aparecerem. WebGL puro.
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `
precision highp float;
uniform vec2 uRes;uniform float uPx;uniform vec2 uAnchor;uniform vec3 uColor;uniform float uStuck;uniform vec2 uStuckCell;
uniform sampler2D uLight;
varying vec2 v;
float box(vec2 q,vec2 c,vec2 s,float e){vec2 d=abs(q-c)-s;return 1.-smoothstep(-e,e,max(d.x,d.y));}
float at(vec2 cell,vec2 target){return 1.-step(.5,max(abs(cell.x-target.x),abs(cell.y-target.y)));}
void main(){
  vec2 frag=v*uRes;
  vec2 rel=(frag-uAnchor)/uPx+.5;           // o pixel morto é a célula (0,0), no ponto de ancoragem
  vec2 cell=floor(rel),f=fract(rel);
  float e=clamp(1.4/uPx,.03,.3);
  vec3 sub=vec3(box(f,vec2(.19,.5),vec2(.1,.37),e),box(f,vec2(.5,.5),vec2(.1,.37),e),box(f,vec2(.81,.5),vec2(.1,.37),e));
  float detail=smoothstep(2.6,7.,uPx);       // pixel pequeno na tela: vira a média das três cores
  float L=texture2D(uLight,(uAnchor+cell*uPx)/uRes).r;
  L=smoothstep(.04,.62,L);
  vec3 off=mix(vec3(.05),(sub.r+sub.g+sub.b)*vec3(.075)+sub*.04,detail);
  vec3 lit=mix(uColor*.95,uColor*sub*1.7,detail);
  vec3 c=mix(off,lit,L)+uColor*L*.14;
  c=mix(c,off,at(cell,vec2(0.)));           // o pixel morto parece igual aos outros apagados; só não acende
  vec3 g=vec3(0.,1.,0.)*mix(.9,sub.g*1.3,detail);
  c=mix(c,max(c,g),at(cell,uStuckCell)*uStuck);
  vec2 q=(v-.5)*vec2(uRes.x/uRes.y,1.);
  c*=1.-.3*smoothstep(.5,1.1,length(q));
  gl_FragColor=vec4(c,1.);
}`;

const S0 = 2.6; // tamanho do pixel na tela (px) quando a seção entra
const S1 = 11; // o máximo de perto
const STUCK = [6, 4]; // pixel travado: 6 à direita e 4 acima do pixel morto

export function mountPixels({ root, gsap, still }) {
  const canvas = root.querySelector(".px-gl");
  const pin = root.querySelector(".px-pin");
  const label = root.querySelector(".px-found");
  const ring = root.querySelector(".px-ring");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) throw new Error("sem WebGL");
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(["uRes", "uPx", "uAnchor", "uColor", "uStuck", "uStuckCell", "uLight"].map((n) => [n, gl.getUniformLocation(prog, n)]));

  // Mapa de luz: canvas pequeno onde o cursor pinta e que escurece um pouco a cada quadro.
  const light = document.createElement("canvas");
  const lx = light.getContext("2d", { willReadFrequently: true });
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u.uLight, 0);

  const state = { zoom: still ? 0.85 : 0, r: 1, g: 1, b: 1, stuck: 0 };
  const dpr = Math.min(2, devicePixelRatio);
  let w = 1, h = 1, ax = 0, ay = 0; // tamanho do painel e posição do pixel morto, em px de CSS
  let dirty = true, awake = 0, found = 0, visible = false, last = null, idleSince = 0;
  const size = () => S0 * Math.pow(S1 / S0, state.zoom);
  const radius = () => Math.max(56, Math.min(w, h) * 0.085);

  function resize() {
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    light.width = 256;
    light.height = Math.max(1, Math.round((256 * h) / w));
    const narrow = w < 700;
    ax = Math.round(w * (narrow ? 0.6 : 0.64));
    ay = Math.round(h * (narrow ? 0.3 : 0.4));
    dirty = true;
  }

  function splat(x, y, k = 1) {
    const s = light.width / w;
    const r = radius() * s;
    const g = lx.createRadialGradient(x * s, y * s, 0, x * s, y * s, r);
    g.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.9 * k)})`);
    g.addColorStop(0.5, `rgba(255,255,255,${0.45 * k})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    lx.globalCompositeOperation = "lighter";
    lx.fillStyle = g;
    lx.fillRect(x * s - r, y * s - r, 2 * r, 2 * r);
    awake = 100;
  }
  // Movimento rápido: preenche o caminho entre um ponto e outro, para o rastro não sair pontilhado.
  function trail(x, y, k = 1) {
    if (last) {
      const d = Math.hypot(x - last.x, y - last.y);
      const step = radius() * 0.35;
      for (let i = step; i < d; i += step) splat(last.x + ((x - last.x) * i) / d, last.y + ((y - last.y) * i) / d, k * 0.7);
    }
    splat(x, y, k);
    last = { x, y };
  }
  // Com o cursor parado em cima do painel, os pixels embaixo dele continuam acesos.
  let hover = null;
  function fromEvent(e) {
    const r = canvas.getBoundingClientRect();
    hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    trail(hover.x, hover.y);
    idleSince = performance.now();
  }
  pin.addEventListener("pointermove", fromEvent);
  pin.addEventListener("pointerdown", fromEvent);
  pin.addEventListener("pointerleave", () => {
    last = null;
    hover = null;
  });
  pin.addEventListener("pointercancel", () => {
    last = null;
    hover = null;
  });

  // Celular e tablet não têm mouse: uma luz passeia sozinha pelo painel enquanto ninguém toca nele.
  const touchOnly = matchMedia("(hover: none)").matches;
  let ghostLast = null;
  function ghost(t) {
    if (!touchOnly || still || performance.now() - idleSince < 2500) {
      ghostLast = null;
      return;
    }
    const x = ax + Math.sin(t * 0.62) * w * 0.32 + Math.sin(t * 1.7) * w * 0.05;
    const y = ay + Math.sin(t * 0.91 + 1.2) * h * 0.2;
    last = ghostLast;
    trail(x, y, 0.8);
    ghostLast = last;
    last = null;
  }

  function fade(dt) {
    lx.globalCompositeOperation = "source-over";
    lx.fillStyle = `rgba(0,0,0,${(1 - Math.pow(0.93, dt * 60)).toFixed(4)})`;
    lx.fillRect(0, 0, light.width, light.height);
  }

  // O rótulo aparece quando a luz passa pelo pixel morto (ou sempre, no preto, junto do pixel travado).
  function placeLabel(now) {
    const s = light.width / w;
    const hit = lx.getImageData(Math.min(light.width - 1, Math.round(ax * s)), Math.min(light.height - 1, Math.round(ay * s)), 1, 1).data[0];
    if (hit > 110) found = now + 1800;
    const black = state.stuck > 0.5;
    const px = size();
    const x = black ? ax + STUCK[0] * px : ax;
    const y = black ? ay - STUCK[1] * px : ay;
    const d = Math.max(30, px * 3.2);
    ring.style.width = ring.style.height = `${d}px`;
    ring.style.transform = `translate(${x - d / 2}px,${y - d / 2}px)`;
    label.style.transform = `translate(${x}px,${y + d / 2 + 10}px) translateX(-50%)`;
    const text = black ? label.dataset.stuck : label.dataset.dead;
    if (label.textContent !== text) label.textContent = text;
    root.classList.toggle("is-found", state.zoom > 0.45 && (black || now < found));
  }

  function render() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, light);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uPx, size() * dpr);
    gl.uniform2f(u.uAnchor, ax * dpr, (h - ay) * dpr);
    gl.uniform3f(u.uColor, state.r, state.g, state.b);
    gl.uniform1f(u.uStuck, state.stuck);
    gl.uniform2f(u.uStuckCell, STUCK[0], STUCK[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    dirty = true;
  }).observe(root);
  root.classList.add("is-live");

  gsap.ticker.add((time, deltaMs) => {
    if (!visible) return;
    const now = performance.now();
    ghost(time);
    if (hover) splat(hover.x, hover.y, 0.3);
    if (awake <= 0 && !dirty && now > found + 400) return;
    fade(Math.min(0.1, deltaMs / 1000));
    render();
    placeLabel(now);
    awake--;
    dirty = false;
  });

  // A aproximação começa assim que o painel entra na tela e termina quando ele fica inteiro nela.
  if (!still) gsap.to(state, { zoom: 1, ease: "none", onUpdate: () => (dirty = true), scrollTrigger: { trigger: root, start: "top 85%", end: "top top", scrub: 0.4 } });

  return {
    setColor([r, g, b]) {
      const to = { r: r / 255, g: g / 255, b: b / 255, stuck: r + g + b === 0 ? 1 : 0 };
      if (still) {
        Object.assign(state, to);
        dirty = true;
      } else gsap.to(state, { ...to, duration: 0.25, ease: "power2.out", onUpdate: () => (dirty = true) });
    },
  };
}
