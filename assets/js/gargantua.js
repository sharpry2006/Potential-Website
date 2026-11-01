/* POTENTIAL / Gargantua: Schwarzschild null-geodesic ray marcher (WebGL). Hall page only. */
(function () {
  'use strict';
  if (!document.body.classList.contains('pg-hall')) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__gT != null;
  var cv = document.createElement('canvas');
  cv.className = 'gargantua';
  cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;
  var FS = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float O;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p,float P){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float y0=mod(i.y,P),y1=mod(i.y+1.,P);return mix(mix(h(vec2(i.x,y0)),h(vec2(i.x+1.,y0)),f.x),mix(h(vec2(i.x,y1)),h(vec2(i.x+1.,y1)),f.x),f.y);}
float fbm(vec2 p,float P){float a=.55,s=0.;for(int i=0;i<4;i++){s+=a*nz(p,P);p*=2.;P*=2.;a*=.5;}return s;}
float flowAt(vec2 xz,float rr){
float a=atan(xz.y,xz.x)/6.2831853*24.;float s=3.2*pow(rr,-1.5)/6.2831853*24.;
float c=T/36.;float f1=fract(c),f2=fract(c+.5);float t1=f1*36.,t2=f2*36.;
float w1=1.-abs(2.*f1-1.),w2=1.-abs(2.*f2-1.);
float u1=a-s*t1,u2=a-s*t2;
float n1=fbm(vec2(rr*18.,u1),24.)*.4+fbm(vec2(rr*55.,u1*2.),48.)*.35+fbm(vec2(rr*140.,u1*3.),72.)*.25;
float n2=fbm(vec2(rr*18.,u2),24.)*.4+fbm(vec2(rr*55.,u2*2.),48.)*.35+fbm(vec2(rr*140.,u2*3.),72.)*.25;
return n1*w1+n2*w2;}
vec3 trails(vec3 d){float ph=atan(d.z,d.x)+T*.012;float band=d.y*70.;float id=floor(band);float fr=fract(band);float rnd=h(vec2(id,7.));float w=smoothstep(.07,0.,abs(fr-.5));float seg=smoothstep(.2,.9,.5*sin(ph*5.+rnd*20.)+.5*sin(ph*13.+rnd*9.));return vec3(1.,.8,.55)*w*seg*step(.5,rnd)*.4*(1.-smoothstep(.5,.9,abs(d.y)));}vec3 stars(vec3 d){vec3 q=d*90.;vec3 i=floor(q);float r=fract(sin(dot(i,vec3(12.9898,78.233,37.719)))*43758.5453);vec3 f=fract(q)-.5;float m=step(.9965,r)*smoothstep(.28,0.,length(f));return vec3(.9,.85,.75)*m*(.4+.6*fract(r*91.7));}
vec3 gold(float t){t=clamp(t,0.,1.6);vec3 a=vec3(.12,.04,.01),b=vec3(.95,.45,.1),c=vec3(1.,.82,.45),d=vec3(1.,.97,.85);return t<.5?mix(a,b,t*2.):t<1.?mix(b,c,(t-.5)*2.):mix(c,d,(t-1.)/.6);}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;uv.x-=O;
float el=.12+M.y*.04,az=M.x*.1;
vec3 ro=12.*vec3(sin(az)*cos(el),sin(el),-cos(az)*cos(el));
vec3 fw=normalize(-ro),rt=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,rt);
float rl=-.3;vec3 rt2=rt*cos(rl)+up*sin(rl),up2=up*cos(rl)-rt*sin(rl);vec3 v=normalize(fw*1.1+rt2*uv.x+up2*uv.y);
vec3 p=ro;vec3 hv=cross(p,v);float h2=dot(hv,hv);
vec3 col=vec3(0.);float Tn=1.,gw=0.;
for(int i=0;i<300;i++){
float r=length(p);
if(r<1.){Tn=0.;gw=0.;break;}
if(r>26.&&dot(p,v)>0.){col+=Tn*(stars(v)+trails(v));break;}
float dt=.03*r+.012;
v=normalize(v-1.5*h2*p/(r*r*r*r*r)*dt);
vec3 pn=p+v*dt;
gw+=Tn*dt*exp(-pn.y*pn.y*1.4)*smoothstep(2.8,3.6,r)*(1.-smoothstep(5.,11.,r))*.02/(1.+.1*r);
if(p.y*pn.y<0.){
float k=p.y/(p.y-pn.y);vec3 hp=mix(p,pn,k);float rr=length(hp.xz);
if(rr>3.&&rr<9.5){
vec3 tg=normalize(vec3(-hp.z,0.,hp.x));
float dop=dot(tg,-v);
float bo=pow(clamp(1.+.6*dop,.25,1.8),2.6);
float e=pow(3./rr,.85)*(.12+1.6*flowAt(hp.xz,rr))*bo;
e*=smoothstep(3.,3.5,rr)*(1.-smoothstep(7.,9.5,rr));
col+=Tn*gold(e)*min(e*1.3,1.5);
Tn*=.2;}}
p=pn;}
col+=gw*vec3(1.,.5,.15);
col+=Tn*vec3(.02,.022,.03);
col=1.-exp(-col*1.3);
gl_FragColor=vec4(pow(col,vec3(.9)),1.);}`;
  function sh(t, s) {
    var o = gl.createShader(t);
    gl.shaderSource(o, s);
    gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error('gargantua shader: ' + gl.getShaderInfoLog(o)); return null; }
    return o;
  }
  var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
  var fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var pg = gl.createProgram();
  gl.attachShader(pg, vs);
  gl.attachShader(pg, fs);
  gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) { console.error('gargantua link: ' + gl.getProgramInfoLog(pg)); return; }
  gl.useProgram(pg);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pg, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pg, 'R'), uT = gl.getUniformLocation(pg, 'T'), uM = gl.getUniformLocation(pg, 'M'), uO = gl.getUniformLocation(pg, 'O');
  var scrim = document.createElement('div');
  scrim.className = 'gargantua-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(scrim, document.body.firstChild);
  document.body.insertBefore(cv, scrim);
  var mx = 0, my = 0, tx = 0, ty = 0, last = 0;
  function size() {
    var k = window.__gScale || (window.innerWidth < 760 ? 0.5 : 0.6);
    cv.width = Math.max(2, Math.round(window.innerWidth * k));
    cv.height = Math.max(2, Math.round(window.innerHeight * k));
    gl.viewport(0, 0, cv.width, cv.height);
    if (still) draw(window.__gT != null ? window.__gT : 14);
  }
  function draw(t) {
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uT, t);
    gl.uniform2f(uM, mx, my);
    gl.uniform1f(uO, window.innerWidth < 760 ? 0 : (cv.width / cv.height) * 0.26);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    window.__gFrames = (window.__gFrames || 0) + 1;
  }
  function fade() { cv.style.opacity = Math.max(0.3, 1 - window.scrollY / (window.innerHeight * 0.9)).toFixed(2); }
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', size);
  size();
  fade();
  if (still) return;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  function loop(ms) {
    requestAnimationFrame(loop);
    if (ms - last < 33) return;
    last = ms;
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    draw(ms / 1000);
  }
  requestAnimationFrame(loop);
})();
