import"./chunk-O2XFH626.js";var g="attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}",b=`
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
}`;function x({root:c,gsap:u,still:f}){let o=c.querySelector(".px-gl"),d=c.querySelector(".px-found"),e=o.getContext("webgl",{antialias:!1,alpha:!1});if(!e)throw new Error("sem WebGL");let m=(r,s)=>{let t=e.createShader(r);if(e.shaderSource(t,s),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(t));return t},i=e.createProgram();e.attachShader(i,m(e.VERTEX_SHADER,g)),e.attachShader(i,m(e.FRAGMENT_SHADER,b)),e.linkProgram(i),e.useProgram(i),e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let v=e.getAttribLocation(i,"p");e.enableVertexAttribArray(v),e.vertexAttribPointer(v,2,e.FLOAT,!1,0,0);let n=Object.fromEntries(["uRes","uZoom","uColor","uPx"].map(r=>[r,e.getUniformLocation(i,r)])),a={zoom:f?.92:0,r:1,g:1,b:1},h=Math.min(2,devicePixelRatio);function l(){e.uniform2f(n.uRes,o.width,o.height),e.uniform1f(n.uZoom,a.zoom),e.uniform3f(n.uColor,a.r,a.g,a.b),e.uniform1f(n.uPx,1),e.drawArrays(e.TRIANGLES,0,3)}function p(){o.width=o.clientWidth*h,o.height=o.clientHeight*h,e.viewport(0,0,o.width,o.height),l()}return p(),addEventListener("resize",p),c.classList.add("is-live"),f||(u.set(d,{autoAlpha:0}),u.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:c,start:"top top",end:"bottom bottom",scrub:.5}}).to(a,{zoom:1,duration:.8,ease:"power2.in",onUpdate:l},0).to(d,{autoAlpha:1,duration:.1},.72).to({},{duration:.2})),{setColor([r,s,t]){f?(Object.assign(a,{r:r/255,g:s/255,b:t/255}),l()):u.to(a,{r:r/255,g:s/255,b:t/255,duration:.25,ease:"power2.out",onUpdate:l})}}}export{x as mountPixels};
