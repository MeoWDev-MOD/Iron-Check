// Seção de pixels: um painel em GLSL com os subpixels R, G e B de cada pixel, apagados até o mouse (ou o dedo) passar.
// O cursor pinta um rastro de luz colorido, branco na ponta e mudando de cor ao longo do caminho, que se espalha e
// desfoca ao apagar; cada subpixel acende com a parte da cor que é dele. Um pixel é morto e nunca acende; com o preto
// escolhido aparece um pixel travado (o verde sempre aceso). São os defeitos que o teste de tela do Iron Check mostra.
// As bordas do painel se dissolvem no roxo de cima e no fundo de baixo, para a seção não começar nem terminar num corte.
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `
precision highp float;
uniform vec2 uRes;uniform float uPx;uniform vec2 uAnchor;uniform vec3 uColor;uniform float uStuck;uniform vec2 uStuckCell;
uniform sampler2D uLight;
varying vec2 v;
float box(vec2 q,vec2 c,vec2 s,float e){vec2 d=abs(q-c)-s;return 1.-smoothstep(-e,e,max(d.x,d.y));}
float at(vec2 cell,vec2 target){return 1.-step(.5,max(abs(cell.x-target.x),abs(cell.y-target.y)));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 frag=v*uRes;
  vec2 rel=(frag-uAnchor)/uPx+.5;           // o pixel morto é a célula (0,0), no ponto de ancoragem
  vec2 cell=floor(rel),f=fract(rel);
  float e=clamp(1.4/uPx,.03,.3);
  vec3 sub=vec3(box(f,vec2(.19,.5),vec2(.1,.37),e),box(f,vec2(.5,.5),vec2(.1,.37),e),box(f,vec2(.81,.5),vec2(.1,.37),e));
  float detail=smoothstep(2.6,7.,uPx);       // pixel pequeno na tela: vira a média das três cores
  vec3 L=smoothstep(vec3(.03),vec3(1.),texture2D(uLight,(uAnchor+cell*uPx)/uRes).rgb);
  L=clamp(L*(.72+.56*hash(cell)),0.,1.);     // cada pixel acende um pouco diferente: a borda fica espalhada
  float Lm=max(L.r,max(L.g,L.b));
  vec3 show=L*uColor;                        // a cor que o pixel mostra (a cor do teste filtra a luz)
  vec3 off=mix(vec3(.05),(sub.r+sub.g+sub.b)*vec3(.075)+sub*.04,detail);
  vec3 lit=mix(show*.95,sub*show*1.7,detail);
  vec3 c=off*(1.-Lm)+lit+show*.12;
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

// Cor saturada do rastro para um matiz (0 a 360), como "r,g,b".
function hue(h) {
  const k = (n) => (n + h / 30) % 12;
  const f = (n) => 0.5 - 0.5 * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)).join(",");
}

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

  // Mapa de luz: canvas pequeno onde o cursor pinta em cor; a cada quadro ele escurece e desfoca um pouco.
  const light = document.createElement("canvas");
  const lx = light.getContext("2d", { willReadFrequently: true });
  const canBlur = typeof lx.filter === "string"; // Safari antigo não desfoca canvas: aí a luz só apaga
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
  let dirty = true, awake = 0, found = 0, visible = false, idleSince = 0, travel = 0, clock = 0;
  const size = () => S0 * Math.pow(S1 / S0, state.zoom);
  const radius = () => Math.max(36, Math.min(60, Math.min(w, h) * 0.045));

  function resize() {
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    light.width = 256;
    light.height = Math.max(1, Math.round((256 * h) / w));
    lx.fillStyle = "#000";
    lx.fillRect(0, 0, light.width, light.height);
    const narrow = w < 700;
    ax = Math.round(w * (narrow ? 0.6 : 0.64));
    ay = Math.round(h * (narrow ? 0.3 : 0.4));
    dirty = true;
  }

  // Mancha de luz: miolo branco e borda na cor do momento. "lighten" fica com o mais claro de cada cor, então a
  // luz parada não estoura numa bola chapada e as cores do rastro se somam onde ele se cruza.
  function splat(x, y) {
    const s = light.width / w;
    const r = radius() * s;
    const c = hue((travel * 0.45 + clock * 50) % 360);
    const g = lx.createRadialGradient(x * s, y * s, 0, x * s, y * s, r);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.2, "rgb(235,235,235)");
    g.addColorStop(0.45, `rgb(${c})`);
    g.addColorStop(0.75, `rgba(${c},.32)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    lx.globalCompositeOperation = "lighten";
    lx.fillStyle = g;
    lx.fillRect(x * s - r, y * s - r, 2 * r, 2 * r);
    awake = 120;
  }
  function stroke(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / (radius() * 0.25)));
    for (let i = 1; i <= n; i++) {
      travel += d / n;
      splat(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
    }
  }

  // A luz segue o ponto do mouse com um leve atraso: o rastro sai como uma fita, mesmo com o mouse aos trancos.
  let target = null;
  let brush = null;
  function aim(x, y) {
    target = { x, y };
    if (!brush) brush = { x, y };
    awake = 120;
  }
  function fromEvent(e) {
    const r = canvas.getBoundingClientRect();
    aim(e.clientX - r.left, e.clientY - r.top);
    idleSince = performance.now();
  }
  const leave = () => {
    target = null;
    brush = null;
  };
  pin.addEventListener("pointermove", fromEvent);
  pin.addEventListener("pointerdown", fromEvent);
  pin.addEventListener("pointerleave", leave);
  pin.addEventListener("pointercancel", leave);
  function moveBrush(dt) {
    if (!target) return;
    const k = 1 - Math.pow(0.75, dt * 60);
    const nx = brush.x + (target.x - brush.x) * k;
    const ny = brush.y + (target.y - brush.y) * k;
    stroke(brush.x, brush.y, nx, ny);
    brush.x = nx;
    brush.y = ny;
  }

  // Celular e tablet não têm mouse: uma luz passeia sozinha pelo painel enquanto ninguém toca nele.
  const touchOnly = matchMedia("(hover: none)").matches;
  function ghost(t) {
    if (!touchOnly || still || performance.now() - idleSince < 2500) return;
    aim(ax + Math.sin(t * 0.62) * w * 0.32 + Math.sin(t * 1.7) * w * 0.05, ay + Math.sin(t * 0.91 + 1.2) * h * 0.2);
  }

  function fade(dt) {
    const keep = Math.pow(0.962, dt * 60);
    if (canBlur) {
      lx.globalCompositeOperation = "copy";
      lx.filter = `blur(${(0.85 * dt * 60).toFixed(2)}px) brightness(${keep.toFixed(4)})`;
      lx.drawImage(light, 0, 0);
      lx.filter = "none";
    } else {
      lx.globalCompositeOperation = "source-over";
      lx.fillStyle = `rgba(0,0,0,${(1 - keep).toFixed(4)})`;
      lx.fillRect(0, 0, light.width, light.height);
    }
  }

  // O rótulo aparece quando a luz passa pelo pixel morto (ou sempre, no preto, junto do pixel travado).
  function placeLabel(now) {
    const s = light.width / w;
    const d4 = lx.getImageData(Math.min(light.width - 1, Math.round(ax * s)), Math.min(light.height - 1, Math.round(ay * s)), 1, 1).data;
    if (Math.max(d4[0], d4[1], d4[2]) > 110) found = now + 1800;
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
    const dt = Math.min(0.1, deltaMs / 1000);
    clock += dt;
    ghost(time);
    if (awake <= 0 && !dirty && now > found + 400) return;
    fade(dt);
    moveBrush(dt);
    render();
    placeLabel(now);
    awake--;
    dirty = false;
  });

  if (!still) {
    // A aproximação começa assim que o painel entra na tela e termina quando ele fica inteiro nela.
    gsap.to(state, { zoom: 1, ease: "none", onUpdate: () => (dirty = true), scrollTrigger: { trigger: root, start: "top 85%", end: "top top", scrub: 0.4 } });
    // Passagem macia: o painel nasce do roxo da seção de cima e se dissolve no fundo da de baixo.
    const fadeTop = document.createElement("div");
    const fadeBottom = document.createElement("div");
    fadeTop.className = "px-fade px-fade-top";
    fadeBottom.className = "px-fade px-fade-bottom";
    canvas.after(fadeTop, fadeBottom);
    gsap.fromTo(fadeTop, { opacity: 1 }, { opacity: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 70%", end: "top top", scrub: true } });
    gsap.fromTo(fadeBottom, { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: root, start: "bottom 135%", end: "bottom bottom", scrub: true } });
  }

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
