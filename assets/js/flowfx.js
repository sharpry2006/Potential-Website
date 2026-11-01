/* POTENTIAL flowfx: page-themed WebGL light-flow backgrounds.
   Mecha pages: contour polylines traced offline from reference art (assets/fx/*_lines.bin) are drawn in, carry light pulses along their
   arc length, then dissolve into flow-field dust and re-condense; dust leaves streaks in a feedback buffer and the frame gets a bloom pass.
   Home: particle solar system with glowing orbit wakes; tilts toward and gravitates to the pointer. Hall is handled by gargantua.js.
   ?fxT=<s> offsets the clock (for screenshots). */
(function () {
  'use strict';
  var B = document.body.classList;
  var PAGES = {
    'pg-home': { solar: true, bg: 0, S: 1.25, cy: 30, th: .3, bs: 1.1 },
    'pg-robots': { src: 'strike', bg: 1, S: 1.2, cy: 26, ink: [.62, .78, 1], pul: [.45, .8, 1], hot: [1, .4, .3], fl: .4, th: .32, bs: 1.2 },
    'pg-about': { src: 'ac', bg: 2, S: 1.32, cy: 28, ink: [.8, .84, .92], pul: [1, .96, .9], hot: [1, 1, 1], fl: 1, vg: 1, th: .34, bs: 1.25 },
    'pg-gallery': { src: 'stargazer', bg: 3, S: 1.25, cy: 26, ink: [.5, .52, .62], pul: [1, .82, .3], hot: [1, .85, .25], fl: .3, th: .3, bs: 1.4 },
    'pg-results': { src: 'unicorn', bg: 4, S: 1.0, ox: .4, cy: 26, ink: [.78, .85, 1], pul: [.4, .85, 1], hot: [.4, .7, 1], fl: .5, th: .32, bs: 1.3, ag: 3.6 }
  };
  var cfg = null;
  for (var k in PAGES) if (B.contains(k)) cfg = PAGES[k];
  if (!cfg) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qT = /[?&]fxT=([\d.]+)/.exec(location.search), t0 = qT ? +qT[1] : 0;
  var cv = document.createElement('canvas');
  cv.className = 'flowfx';
  cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;
  B.add('has-flowfx');

  var BG = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float K;uniform float O;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
vec3 stars(vec2 uv,float sc,float tw){vec2 g=uv*sc;vec2 i=floor(g),f=fract(g)-.5;float r=h(i);vec2 o=vec2(h(i+3.1),h(i+7.7))-.5;float d=length(f-o*.7);float b=step(.93,r)*smoothstep(.06+.05*fract(r*13.),0.,d);float t=1.+tw*.5*sin(T*(1.5+3.*fract(r*37.))+r*40.);return vec3(.85+.15*fract(r*7.),.9,1.)*b*max(t,0.)*(.4+.8*fract(r*91.));}
vec3 milky(vec2 uv,float an){vec2 q=mat2(cos(an),-sin(an),sin(an),cos(an))*uv;float band=exp(-q.y*q.y*9.);float n=fbm(q*3.+vec2(T*.004,0.));float dust=fbm(q*7.-3.);return mix(vec3(.25,.3,.55),vec3(.95,.8,.6),n)*band*(.25+.6*n)*(1.-.7*smoothstep(.45,.75,dust)*band)*.55;}
void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;vec2 pm=uv+M*.02;vec3 col=vec3(.006,.008,.014);vec2 c=uv-vec2(O*.5,0.);
if(K<.5){col+=milky(pm,.5)*.6+stars(pm,180.,.6)+stars(pm*1.7+3.,260.,.9)*.6+vec3(.05,.03,.08)*fbm(pm*2.+T*.01);
 float rc=length(c);float ray=pow(n2(vec2(atan(c.y,c.x)*9.,T*.15)),4.);col+=vec3(1.,.55,.2)*(.012/(rc*rc+.004))*.05+vec3(1.,.6,.25)*ray*exp(-rc*5.)*.25;}
else if(K<1.5){col+=milky(pm,-.35)+stars(pm,200.,.5)+stars(pm+9.,320.,.8)*.5;
 vec2 ec=vec2(O-.35,-1.55);float er=1.25;float d=length(uv-ec);vec2 L2=normalize(vec2(.7,.6));vec3 L=normalize(vec3(.7,.6,.35));
 if(d<er){vec2 s=(uv-ec)/er;float z=sqrt(max(0.,1.-dot(s,s)));vec3 nr=vec3(s,z);float dif=max(dot(nr,L),0.);
  float lon=atan(nr.x,nr.z)+T*.01;float lat=asin(clamp(nr.y,-1.,1.));vec2 tc=vec2(lon*1.6,lat*2.4);
  float land=smoothstep(.52,.58,fbm(tc*1.3));float cl=smoothstep(.5,.8,fbm(tc*2.2+vec2(T*.006,0.)));
  vec3 base=mix(vec3(.02,.07,.2),vec3(.12,.2,.1),land);base=mix(base,vec3(.9),cl*.8);
  float night=smoothstep(.1,-.15,dot(nr,L));vec3 city=vec3(1.,.7,.35)*land*step(.62,fbm(tc*9.))*night*.6;
  col=base*dif+city+vec3(.3,.55,1.)*pow(1.-z,3.)*dif*.8;}
 float rim=exp(-abs(d-er)*60.)*.9+exp(-max(d-er,0.)*14.)*.25*step(er,d);
 col+=vec3(.35,.65,1.)*rim*clamp(dot(normalize(uv-ec),L2)*.6+.5,0.,1.);}
else if(K<2.5){col+=vec3(.05,.055,.06)*fbm(pm*1.6+vec2(T*.02,-T*.01))*1.4;
 vec2 g=pm*40.+vec2(T*.6,T*1.4);vec2 i=floor(g);float r=h(i);vec2 f=fract(g)-.5;
 col+=vec3(1.,.55,.2)*step(.985,r)*smoothstep(.12,0.,length(f))*(.5+.5*sin(T*3.+r*50.));
 col+=stars(pm*vec2(1.,.3)+vec2(0.,T*.05),120.,0.)*.25;}
else if(K<3.5){col+=milky(pm,.9)*.5+stars(pm,140.,1.6)*1.4+stars(pm*1.3+5.,230.,1.8)+stars(pm*2.1+1.,380.,2.)*.7+vec3(.12,.1,.02)*exp(-dot(c,c)*2.5)*.6;}
else{float n=fbm(vec2(pm.x*1.2,pm.y*3.-T*.05));float rays=pow(n2(vec2(atan(c.y,c.x)*12.,T*.2)),3.);
 col+=vec3(.1,.35,.9)*n*.25+vec3(.5,.8,1.)*rays*exp(-length(c)*1.6)*.35+stars(pm,200.,.8)*.6;}
col=1.-exp(-col*1.4);gl_FragColor=vec4(col,1.);}`;

  var LV = `attribute vec2 a_p;attribute vec2 a_sr;attribute vec4 a_c;
uniform vec2 R;uniform float S;uniform float O;
varying vec2 vsr;varying vec4 vc;varying vec2 vp;varying vec2 vq;
void main(){float A=R.x/R.y;vec2 p=(a_p-.5)*vec2(2.,-2.)*S;p.x=p.x/A+O;gl_Position=vec4(p,0.,1.);vsr=a_sr;vc=a_c;vp=p;vq=a_p;}`;
  var LF = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 INK;uniform vec3 PUL;uniform float FL;uniform float VG;uniform float CY;
varying vec2 vsr;varying vec4 vc;varying vec2 vp;varying vec2 vq;
void main(){float A=R.x/R.y;float s=vsr.x,r=vsr.y,k=vc.a;float tt=fract(T/CY);
float head=tt*6.-r*.6;float vis=smoothstep(head,head-.012,s);
float tip=exp(-abs(s-head)*90.)*step(s,head+.01)*(1.-smoothstep(.2,.3,tt));
float outv=1.-smoothstep(.86+r*.05,.9+r*.05,tt);
float pul=pow(max(0.,sin(s*55.-T*2.4+r*60.)),30.)*step(.45,fract(r*7.31));
float pul2=pow(max(0.,sin(s*9.-T*.9+r*20.)),6.)*.35;
float sw=exp(-pow(vp.x*.5+vp.y-(fract(T/8.)*5.-2.5),2.)*22.);
vec2 d=(vp-M)*vec2(A,1.);float mg=exp(-dot(d,d)*14.);
float vg=mix(1.,1.-smoothstep(.36,.6,length((vq-.5)*vec2(1.,1.5))),VG);
vec3 base=mix(INK,vc.rgb,.4)*(.18+.55*k);
vec3 col=base*(1.+mg*2.5+sw*FL*2.)+PUL*(pul*1.8+pul2)*(.6+k)+PUL*tip*2.5+vec3(1.)*sw*FL*.5*k;
gl_FragColor=vec4(col*vis*outv*vg,1.);}`;

  var DV = `attribute vec2 a_p;attribute vec4 a_c;attribute vec2 a_st;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;uniform float O;uniform float D;uniform float CY;uniform vec3 HOT;uniform float VG;uniform float AG;
varying vec3 vc;varying float va;
vec2 fld(vec2 p,float t){return vec2(sin(p.y*3.1+t*.3)+.6*sin(p.y*7.3-t*.23+p.x*2.),cos(p.x*2.7-t*.27)+.6*cos(p.x*6.1+t*.19-p.y*1.5));}
void main(){float A=R.x/R.y;float sd=a_st.x;float tt=fract(T/CY);
vec2 b=(a_p-.5)*vec2(2.,-2.)*S;float sz,al;vec3 c;
float bu=tt>.5?smoothstep(.84,1.,tt):1.-smoothstep(0.,.26,tt);
if(a_st.y<.5){float life=fract(T*(.04+.05*fract(sd*13.7))+sd*7.);
 float amp=.07*life+bu*bu*(.9+.6*fract(sd*3.3));
 for(int i=0;i<4;i++){b+=normalize(fld(b*1.3,T)+vec2(.35,.1))*amp*.25;}
 al=sin(3.1416*life)*(.35+.65*a_c.a)*(1.-bu*.3)+bu*.5;sz=(1.+1.6*a_c.a)*D;c=mix(a_c.rgb,HOT,.25);}
else{float ac=step(1.5,a_st.y);float br=.55+.45*sin(T*1.4+a_p.x*9.+a_p.y*5.+sd*3.);
 br=mix(br,.45+1.1*pow(max(0.,sin(T*2.6-(a_p.x+a_p.y*.4)*28.+sd*1.5)),6.)+.25*sin(T*7.+sd*40.),ac);b+=fld(b*2.+sd,T)*bu*.6;
 b+=(vec2(sd,fract(sd*7.3))-.5)*.004*ac*sin(T*3.+sd*20.);
 al=br*(1.-bu*.6)*(1.+AG*ac);sz=(2.+3.*a_c.a)*D*(1.+.4*br)*(1.-.35*ac);c=mix(a_c.rgb,HOT,.5*(1.-ac));}
b.x=b.x/A+O;
vec2 d=(b-M)*vec2(A,1.);float f=exp(-dot(d,d)*30.);b+=normalize(d+1e-4)*vec2(1./A,1.)*f*.05;
float vg=mix(1.,1.-smoothstep(.36,.62,length((a_p-.5)*vec2(1.,1.5))),VG);
gl_Position=vec4(b,0.,1.);gl_PointSize=sz;vc=c;va=al*vg*(1.+f);}`;
  var DF = `precision mediump float;varying vec3 vc;varying float va;uniform float G;
void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.;if(r>1.)discard;gl_FragColor=vec4(vc*va*exp(-r*3.)*G,1.);}`;

  var SV = `attribute vec4 q;attribute vec3 o;attribute vec4 c;attribute vec2 e;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;uniform float O;uniform float D;
varying vec3 vc;varying float va;
void main(){float A=R.x/R.y;float a=q.y+T*q.z;vec3 col=c.rgb;
if(q.x>.01&&dot(o,o)>0.){vec3 ds=-normalize(vec3(cos(a),0.,sin(a)));col*=.2+.8*clamp(dot(normalize(o),ds)*.8+.4,0.,1.);}
if(e.y>0.){float dd=mod(e.x+T*e.y-q.y,6.2831853);col*=.25+2.4*exp(-dd*1.4);}
vec3 w=vec3(cos(a)*q.x,q.w,sin(a)*q.x)+o;
float az=T*.02+M.x*.35,el=.42+M.y*.18;float ca=cos(az),sa=sin(az);w.xz=mat2(ca,-sa,sa,ca)*w.xz;
float ce=cos(el),se=sin(el);w.yz=mat2(ce,-se,se,ce)*w.yz;
float z=w.z+14.;vec2 p=w.xy*(2.2/z)*S;p.x=p.x/A+O;
vec2 dd=(p-M)*vec2(A,1.);float f=exp(-dot(dd,dd)*18.);p-=(p-M)*f*.12;
gl_Position=vec4(p,0.,1.);gl_PointSize=c.w*D*(14./z)*(1.+f*1.5);vc=col;va=1.+f*1.5;}`;
  var SF = `precision mediump float;varying vec3 vc;varying float va;uniform float PTS;uniform float G;
void main(){float a=1.;if(PTS>.5){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.;if(r>1.)discard;a=exp(-r*3.);}gl_FragColor=vec4(vc*va*a*G,1.);}`;

  var QV = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  var PP = 'precision mediump float;varying vec2 v;uniform sampler2D X;uniform sampler2D Y;uniform vec2 P;uniform float G;uniform float TH;uniform float BS;uniform vec4 C;\n';
  var COPY = PP + 'void main(){gl_FragColor=vec4(texture2D(X,v).rgb*G,1.);}';
  var FADE = PP + 'void main(){gl_FragColor=C;}';
  var BRIGHT = PP + 'void main(){vec3 c=(texture2D(X,v+P*vec2(1.5,1.5)).rgb+texture2D(X,v+P*vec2(-1.5,1.5)).rgb+texture2D(X,v+P*vec2(1.5,-1.5)).rgb+texture2D(X,v-P*1.5).rgb)*.25;gl_FragColor=vec4(max(c-TH,0.)*1.5,1.);}';
  var BLUR = PP + 'void main(){vec3 c=texture2D(X,v).rgb*.227;c+=(texture2D(X,v+P*1.385).rgb+texture2D(X,v-P*1.385).rgb)*.316;c+=(texture2D(X,v+P*3.231).rgb+texture2D(X,v-P*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}';
  var FINAL = PP + 'void main(){gl_FragColor=vec4(texture2D(X,v).rgb+texture2D(Y,v).rgb*BS,1.);}';

  function sh(t, s) {
    var o = gl.createShader(t);
    gl.shaderSource(o, s);
    gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error('flowfx shader: ' + gl.getShaderInfoLog(o)); return null; }
    return o;
  }
  function prog(v, f) {
    var a = sh(gl.VERTEX_SHADER, v), b = sh(gl.FRAGMENT_SHADER, f);
    if (!a || !b) return null;
    var p = gl.createProgram();
    gl.attachShader(p, a);
    gl.attachShader(p, b);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('flowfx link: ' + gl.getProgramInfoLog(p)); return null; }
    p.u = {};
    return p;
  }
  var bgP = prog(QV, BG), copyP = prog(QV, COPY), fadeP = prog(QV, FADE), brP = prog(QV, BRIGHT), blP = prog(QV, BLUR), fiP = prog(QV, FINAL);
  var lineP = prog(LV, LF), dustP = prog(DV, DF), solP = prog(SV, SF);
  if (!bgP || !copyP || !fadeP || !brP || !blP || !fiP || !lineP || !dustP || !solP) return;

  function loc(p, n) { return n in p.u ? p.u[n] : (p.u[n] = gl.getUniformLocation(p, n)); }
  function use(p, o) {
    gl.useProgram(p);
    for (var n in o) {
      var v = o[n], l = loc(p, n);
      if (l == null) continue;
      if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else if (v.length === 3) gl.uniform3fv(l, v);
      else gl.uniform4fv(l, v);
    }
  }
  function tx(p, n, unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc(p, n), unit); }
  function mix(a, b) { var o = {}, n; for (n in a) o[n] = a[n]; for (n in b) o[n] = b[n]; return o; }
  var on = [];
  function attrs(p, list, stride) {
    list.forEach(function (x) {
      var l = gl.getAttribLocation(p, x[0]);
      if (l < 0) return;
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, x[1], gl.FLOAT, false, stride, x[2]);
      on.push(l);
    });
  }
  function unattrs() { on.forEach(function (l) { gl.disableVertexAttribArray(l); }); on = []; }
  var qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  function quad(p) { gl.bindBuffer(gl.ARRAY_BUFFER, qb); attrs(p, [['a', 2, 0]], 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); unattrs(); }
  function draws(p, buf, lay, first, n, mode, un) {
    if (n <= 0) return;
    use(p, un);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    attrs(p, lay[0], lay[1]);
    gl.drawArrays(mode, first, n);
    unattrs();
  }
  var SOL = [[['q', 4, 0], ['o', 3, 16], ['c', 4, 28], ['e', 2, 44]], 52];
  var LINE = [[['a_p', 2, 0], ['a_sr', 2, 8], ['a_c', 4, 16]], 32];
  var DUST = [[['a_p', 2, 0], ['a_c', 4, 8], ['a_st', 2, 24]], 32];
  var bufA = gl.createBuffer(), bufB = gl.createBuffer();
  var nA = 0, nB = 0, split = 0, nDust = 0, ready = false;
  function upload(buf, arr) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); }
  function rng(s) { return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(n) { var x = Math.sin(n * 12.9898 + 1.7) * 43758.5453; return x - Math.floor(x); }

  // home: bufA = points (sun first, `split` of them, then moving bodies), bufB = orbit rings as GL_LINES
  function solar() {
    var a = [], ln = [], r = rng(3), TAU = Math.PI * 2, i;
    function P(R, a0, sp, y, ox, oy, oz, cr, cg, cb, sz) { a.push(R, a0, sp, y, ox, oy, oz, cr, cg, cb, sz, 0, 0); }
    function ball(rad) { var u = r() * TAU, v = Math.acos(2 * r() - 1), d = rad * Math.cbrt(r()); return [d * Math.sin(v) * Math.cos(u), d * Math.cos(v), d * Math.sin(v) * Math.sin(u)]; }
    for (i = 0; i < 2400; i++) { var b = ball(.55); P(0, 0, 0, 0, b[0], b[1], b[2], 1, .72 + .22 * r(), .3 + .15 * r(), 2 + 2.2 * r()); }
    for (i = 0; i < 700; i++) P(.55 + .6 * Math.pow(r(), 2), r() * TAU, .12 + .1 * r(), (r() - .5) * .25, 0, 0, 0, 1, .45, .12, 1.3 + r());
    split = a.length / 13;
    var PL = [[1.1, .06, [.7, .65, .6], 1.6, 160], [1.55, .1, [1, .85, .6], 1.2, 320], [2.05, .11, [.35, .6, 1], 1, 380], [2.55, .08, [1, .45, .25], .8, 240],
      [4.3, .3, [.95, .75, .55], .43, 1300], [5.4, .25, [.95, .85, .6], .32, 1000], [6.4, .16, [.6, .9, 1], .22, 500], [7.3, .15, [.35, .5, 1], .18, 480]];
    PL.forEach(function (p, idx) {
      var a0 = r() * TAU, sp = p[3] * .25, c = p[2], SEG = 220, j;
      for (i = 0; i < p[4]; i++) { var b = ball(p[1]), jj = .8 + .4 * r(); P(p[0], a0, sp, 0, b[0], b[1], b[2], c[0] * jj, c[1] * jj, c[2] * jj, 1.4 + 1.3 * r()); }
      if (idx === 2) for (i = 0; i < 60; i++) { var m = ball(.03); P(p[0], a0, sp, 0, .24 + m[0], m[1], m[2], .8, .8, .8, 1.1); }
      if (idx === 5) for (i = 0; i < 1400; i++) { var t = r() * TAU, rr = .36 + .26 * r(), s = Math.sin(t) * rr; P(p[0], a0, sp, 0, Math.cos(t) * rr, s * Math.sin(.45), s * Math.cos(.45), .85, .75, .55, 1 + .6 * r()); }
      for (j = 0; j < SEG; j++) [j, j + 1].forEach(function (q) { ln.push(p[0], q / SEG * TAU, 0, 0, 0, 0, 0, c[0] * .35, c[1] * .35, c[2] * .4, 1, a0, sp); });
    });
    for (i = 0; i < 2600; i++) { var R = 3 + .6 * r(), g = .5 + .3 * r(); P(R, r() * TAU, .15 * Math.pow(3.3 / R, 1.5), (r() - .5) * .1, 0, 0, 0, g, g * .9, g * .8, .9 + .7 * r()); }
    upload(bufA, a); nA = a.length / 13;
    upload(bufB, ln); nB = ln.length / 13;
    ready = true;
    if (still) draw(14);
  }

  // mecha: bufA = line segments (GL_LINES pairs), bufB = dust (first nDust, drawn into trails) + emissive points
  function lines() {
    fetch('assets/fx/' + cfg.src + '_lines.bin?v=6').then(function (res) { if (!res.ok) throw new Error(res.status); return res.arrayBuffer(); }).then(function (buf) {
      var dv = new DataView(buf), V = dv.getUint32(0, true), E = dv.getUint32(4, true), L = [], Dd = [], r = rng(11), i, o;
      var step = Math.max(1, Math.ceil(V / 16000));
      function vert(o) {
        L.push(dv.getUint16(o, true) / 65535, dv.getUint16(o + 2, true) / 65535, dv.getUint16(o + 4, true) / 4096, hash(dv.getUint16(o + 6, true)),
          dv.getUint8(o + 8) / 255, dv.getUint8(o + 9) / 255, dv.getUint8(o + 10) / 255, dv.getUint8(o + 11) / 255);
      }
      for (i = 0; i < V - 1; i++) {
        o = 8 + i * 12;
        if (dv.getUint16(o + 6, true) !== dv.getUint16(o + 18, true)) continue;
        vert(o);
        vert(o + 12);
      }
      for (i = 0; i < V; i += step) {
        o = 8 + i * 12;
        Dd.push(dv.getUint16(o, true) / 65535, dv.getUint16(o + 2, true) / 65535, dv.getUint8(o + 8) / 255, dv.getUint8(o + 9) / 255, dv.getUint8(o + 10) / 255, dv.getUint8(o + 11) / 255, r(), 0);
      }
      nDust = Dd.length / 8;
      for (i = 0; i < E; i++) {
        o = 8 + V * 12 + i * 8;
        Dd.push(dv.getUint16(o, true) / 65535, dv.getUint16(o + 2, true) / 65535, dv.getUint8(o + 4) / 255, dv.getUint8(o + 5) / 255, dv.getUint8(o + 6) / 255, dv.getUint8(o + 7) / 255, r(), 1);
      }
      o = 8 + V * 12 + E * 8;
      if (buf.byteLength >= o + 4) {
        // accent section: page-specific highlights (eye monitor, cannon, beam halberd), kept in their own colour
        var nAcc = dv.getUint32(o, true), q;
        for (i = 0; i < nAcc; i++) {
          q = o + 4 + i * 8;
          Dd.push(dv.getUint16(q, true) / 65535, dv.getUint16(q + 2, true) / 65535, dv.getUint8(q + 4) / 255, dv.getUint8(q + 5) / 255, dv.getUint8(q + 6) / 255, dv.getUint8(q + 7) / 255, r(), 2);
        }
      }
      upload(bufA, L); nA = L.length / 8;
      upload(bufB, Dd); nB = Dd.length / 8;
      ready = true;
      if (still) draw(14);
    }).catch(function (e) { console.error('flowfx data: ' + e); });
  }

  function mk(w, h) {
    var t = gl.createTexture(), f = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { f: f, t: t, w: w, h: h };
  }
  function free(x) { if (x) { gl.deleteFramebuffer(x.f); gl.deleteTexture(x.t); } }
  function target(x) { gl.bindFramebuffer(gl.FRAMEBUFFER, x ? x.f : null); gl.viewport(0, 0, x ? x.w : cv.width, x ? x.h : cv.height); }

  var scrim = document.createElement('div');
  scrim.className = 'flowfx-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(scrim, document.body.firstChild);
  document.body.insertBefore(cv, scrim);
  var mx = 0, my = 0, tx0 = 0, ty0 = 0, last = 0, D = 1, scene, trail, b1, b2;
  function off() { return window.innerWidth < 760 ? 0 : (cfg.ox || .32); }
  function size() {
    D = Math.min(window.devicePixelRatio || 1, 1.25) * (window.innerWidth < 760 ? .55 : .8);
    var w = Math.max(2, Math.round(window.innerWidth * D)), h = Math.max(2, Math.round(window.innerHeight * D));
    cv.width = w;
    cv.height = h;
    [scene, trail, b1, b2].forEach(free);
    scene = mk(w, h);
    trail = mk(w, h);
    b1 = mk(Math.ceil(w / 4), Math.ceil(h / 4));
    b2 = mk(Math.ceil(w / 4), Math.ceil(h / 4));
    if (still) draw(14);
  }
  function draw(t) {
    if (!ready || !scene) return;
    var w = cv.width, h = cv.height, O = off();
    var com = { R: [w, h], T: t, M: [mx, my], O: O, S: cfg.S || 1, D: D, CY: cfg.cy, HOT: cfg.hot || [1, 1, 1], VG: cfg.vg || 0, AG: cfg.ag || .6 };
    // 1. feedback trails: fade the previous frame, add moving bodies / dust
    target(trail);
    gl.enable(gl.BLEND);
    if (still) { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); } else {
      use(fadeP, { C: [0, 0, 0, .09] });
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
      quad(fadeP);
      use(fadeP, { C: [.006, .006, .006, 0] });
      gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
      gl.blendFunc(gl.ONE, gl.ONE);
      quad(fadeP);
      gl.blendEquation(gl.FUNC_ADD);
    }
    gl.blendFunc(gl.ONE, gl.ONE);
    if (cfg.solar) draws(solP, bufA, SOL, split, nA - split, gl.POINTS, mix(com, { PTS: 1, G: .5 }));
    else draws(dustP, bufB, DUST, 0, nDust, gl.POINTS, mix(com, { G: .55 }));
    // 2. scene: background, trails, crisp layer
    target(scene);
    gl.disable(gl.BLEND);
    use(bgP, { R: [w, h], T: t, M: [mx, my], K: cfg.bg, O: O * w / h });
    quad(bgP);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    use(copyP, { G: 1 });
    tx(copyP, 'X', 0, trail.t);
    quad(copyP);
    if (cfg.solar) {
      draws(solP, bufB, SOL, 0, nB, gl.LINES, mix(com, { PTS: 0, G: .6 }));
      draws(solP, bufA, SOL, 0, split, gl.POINTS, mix(com, { PTS: 1, G: 1 }));
    } else {
      draws(lineP, bufA, LINE, 0, nA, gl.LINES, mix(com, { INK: cfg.ink, PUL: cfg.pul, FL: cfg.fl || 0 }));
      draws(dustP, bufB, DUST, nDust, nB - nDust, gl.POINTS, mix(com, { G: 1 }));
    }
    gl.disable(gl.BLEND);
    // 3. bloom at quarter resolution
    target(b1);
    use(brP, { TH: cfg.th, P: [1 / w, 1 / h] });
    tx(brP, 'X', 0, scene.t);
    quad(brP);
    for (var i = 1; i <= 2; i++) {
      target(b2); use(blP, { P: [i / b1.w, 0] }); tx(blP, 'X', 0, b1.t); quad(blP);
      target(b1); use(blP, { P: [0, i / b1.h] }); tx(blP, 'X', 0, b2.t); quad(blP);
    }
    target(null);
    use(fiP, { BS: cfg.bs });
    tx(fiP, 'X', 0, scene.t);
    tx(fiP, 'Y', 1, b1.t);
    quad(fiP);
    gl.activeTexture(gl.TEXTURE0);
  }
  function fade() { cv.style.opacity = Math.max(0.35, 1 - window.scrollY / (window.innerHeight * 1.4)).toFixed(2); }
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', size);
  size();
  fade();
  if (cfg.solar) solar(); else lines();
  if (still) return;
  window.addEventListener('pointermove', function (e) {
    tx0 = (e.clientX / window.innerWidth - 0.5) * 2;
    ty0 = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  function loop(ms) {
    requestAnimationFrame(loop);
    if (ms - last < 33) return;
    last = ms;
    mx += (tx0 - mx) * 0.08;
    my += (ty0 - my) * 0.08;
    draw(ms / 1000 + t0);
  }
  requestAnimationFrame(loop);
})();
