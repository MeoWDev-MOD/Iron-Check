// Seção de pixels: painel em GLSL que aproxima até os subpixels R, G e B com a rolagem e tem um pixel apagado no alvo.
// As cores são as do teste de tela do programa. WebGL puro: não pede biblioteca nenhuma.
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uZoom; uniform vec3 uColor; uniform float uPx;
varying vec2 v;
const vec2 DEAD=vec2(.5,.5);
float box(vec2 q,vec2 c,vec2 s,float e){vec2 d=abs(q-c)-s;return 1.-smoothstep(-e,e,max(d.x,d.y));}
void main(){
  float aspect=uRes.x/uRes.y;
  vec2 q=(v-.5)*vec2(aspect,1.);
  float n=mix(300.,11.,uZoom);            // pixels na altura da janela
  vec2 cellF=q*n+.5;                      // o pixel do alvo fica no meio da tela
  vec2 cell=floor(cellF), f=fract(cellF);
  float size=uRes.y/n*uPx;                // tamanho do pixel na tela de verdade
  float e=clamp(1.2/size,.004,.2);
  vec3 sub=vec3(box(f,vec2(.2,.5),vec2(.105,.4),e),box(f,vec2(.5,.5),vec2(.105,.4),e),box(f,vec2(.8,.5),vec2(.105,.4),e));
  float rowFade=.72+.28*smoothstep(.08,.5,f.y)*(1.-smoothstep(.5,.92,f.y));
  vec3 detail=uColor*sub*rowFade;
  float detailK=smoothstep(4.,12.,size);
  vec3 c=mix(uColor*.72,detail,detailK);
  float dead=1.-step(.5,max(abs(cell.x),abs(cell.y)));
  c*=1.-dead;
  gl_FragColor=vec4(c,1.);
}`;

export function mountPixels({ root, gsap, still }) {
  const canvas = root.querySelector(".px-gl");
  const label = root.querySelector(".px-found");
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
  const u = Object.fromEntries(["uRes", "uZoom", "uColor", "uPx"].map((n) => [n, gl.getUniformLocation(prog, n)]));

  const state = { zoom: still ? 0.92 : 0, r: 1, g: 1, b: 1 };
  const dpr = Math.min(2, devicePixelRatio);
  function draw() {
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uZoom, state.zoom);
    gl.uniform3f(u.uColor, state.r, state.g, state.b);
    gl.uniform1f(u.uPx, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function resize() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  resize();
  addEventListener("resize", resize);
  root.classList.add("is-live");

  if (!still) {
    gsap.set(label, { autoAlpha: 0 });
    gsap
      .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.5 } })
      .to(state, { zoom: 1, duration: 0.8, ease: "power2.in", onUpdate: draw }, 0)
      .to(label, { autoAlpha: 1, duration: 0.1 }, 0.72)
      .to({}, { duration: 0.2 });
  }

  return {
    setColor([r, g, b]) {
      if (still) {
        Object.assign(state, { r: r / 255, g: g / 255, b: b / 255 });
        draw();
      } else gsap.to(state, { r: r / 255, g: g / 255, b: b / 255, duration: 0.25, ease: "power2.out", onUpdate: draw });
    },
  };
}
