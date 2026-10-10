/* =====================================================================
   BARRA LIBRE · guía visual de ejercicios
   Muñeco propio dibujado en SVG (sin imágenes de terceros, funciona sin conexión).
   Cada plantilla son 2 posturas (A = inicio, B = final). La app interpola entre ellas
   y resuelve codos y rodillas con cinemática inversa.
   Ángulos en grados: 0 = hacia abajo, 90 = hacia delante (derecha), 180 = arriba, -90 = atrás.
   ===================================================================== */
const SEG = {torso:32, neck:4, head:6.5, ua:16, fa:15, th:24, sh:23, ft:8};
const GV = a => { const r = a * Math.PI / 180; return [Math.sin(r), Math.cos(r)]; };
const gadd = (p, a, l) => { const v = GV(a); return [p[0] + v[0]*l, p[1] + v[1]*l]; };
const gang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI;
const DIRS = {f:[1,0], b:[-1,0], u:[0,-1], d:[0,1], fu:[.7,-.7], fd:[.7,.7], bu:[-.7,-.7], bd:[-.7,.7]};

/* Extremidad de 2 segmentos que intenta llegar a "target"; dir = hacia dónde se dobla la articulación */
function glimb(base, target, l1, l2, dir){
  const a0 = gang(base, target), d0 = Math.hypot(target[0] - base[0], target[1] - base[1]);
  if (d0 >= l1 + l2 - 0.05) { const j = gadd(base, a0, l1); return [j, gadd(j, a0, l2)]; }
  const d = Math.max(d0, Math.abs(l1 - l2) + 0.05);
  const c = Math.acos(Math.min(1, Math.max(-1, (l1*l1 + d*d - l2*l2) / (2*l1*d)))) * 180 / Math.PI;
  const j1 = gadd(base, a0 + c, l1), j2 = gadd(base, a0 - c, l1);
  const mid = [(base[0] + target[0]) / 2, (base[1] + target[1]) / 2], v = DIRS[dir] || DIRS.f;
  const sc = j => (j[0] - mid[0]) * v[0] + (j[1] - mid[1]) * v[1];
  return [sc(j1) >= sc(j2) ? j1 : j2, target];
}

/* ---------- postura de perfil ---------- */
function poseSide(p){
  const J = {}, hip = p.hip.slice();
  J.hip = hip;
  const t = p.S ? gang(hip, p.S) : (p.t ?? 180);
  J.sho = gadd(hip, t, SEG.torso);
  J.neck = gadd(J.sho, t + (p.nk || 0), SEG.neck);
  J.head = gadd(J.neck, t + (p.nk || 0), SEG.head);
  J.t = t;
  const arm = (s) => {
    const sfx = s ? '2' : '', H = p['H' + sfx], Hs = p['Hs' + sfx], Hh = p['Hh' + sfx];
    const ua = p['ua' + sfx] ?? (s ? p.ua : undefined), fa = p['fa' + sfx] ?? (s ? p.fa : undefined);
    const tgt = H || (Hs && [J.sho[0] + Hs[0], J.sho[1] + Hs[1]]) || (Hh && [hip[0] + Hh[0], hip[1] + Hh[1]]);
    if (tgt) return glimb(J.sho, tgt, SEG.ua, SEG.fa, p['el' + sfx] || p.el || 'b');
    if (ua != null) { const e = gadd(J.sho, ua, SEG.ua); return [e, gadd(e, fa ?? ua, SEG.fa)]; }
    if (s) return null;
    const e = gadd(J.sho, 0, SEG.ua); return [e, gadd(e, 0, SEG.fa)];
  };
  const leg = (s) => {
    const sfx = s ? '2' : '', F = p['F' + sfx];
    const th = p['th' + sfx] ?? (s ? p.th : undefined), sh = p['sh' + sfx] ?? (s ? p.sh : undefined);
    if (F) return glimb(hip, F, SEG.th, SEG.sh, p['kn' + sfx] || p.kn || 'f');
    if (th != null) { const k = gadd(hip, th, SEG.th); return [k, gadd(k, sh ?? th, SEG.sh)]; }
    if (s) return null;
    const k = gadd(hip, 0, SEG.th); return [k, gadd(k, 0, SEG.sh)];
  };
  [J.elb, J.hand] = arm(0);
  const a2 = arm(1); if (a2) [J.elb2, J.hand2] = a2; else { J.elb2 = J.elb; J.hand2 = J.hand; }
  [J.knee, J.ank] = leg(0);
  const l2 = leg(1); if (l2) [J.knee2, J.ank2] = l2; else { J.knee2 = J.knee; J.ank2 = J.ank; }
  J.toe = gadd(J.ank, p.ft ?? 90, SEG.ft);
  J.toe2 = gadd(J.ank2, p.ft2 ?? p.ft ?? 90, SEG.ft);
  if (p.anchor) { const [jn, at] = p.anchor, dx = at[0] - J[jn][0], dy = at[1] - J[jn][1];
    for (const k in J) if (Array.isArray(J[k])) J[k] = [J[k][0] + dx, J[k][1] + dy]; }
  return J;
}

/* ---------- postura de frente ---------- */
function poseFront(p){
  const J = {}, cx = p.cx ?? 80, hy = p.hy ?? 60, el = p.el || 0;
  J.hip = [cx, hy]; J.hipL = [cx - 6, hy]; J.hipR = [cx + 6, hy];
  J.neck = [cx, hy - SEG.torso - 2 + el];
  J.head = [cx, J.neck[1] - SEG.head - 2];
  J.shoL = [cx - 11, hy - SEG.torso + 2 + el]; J.shoR = [cx + 11, hy - SEG.torso + 2 + el];
  const arm = (sh, ua, fa, sgn) => { const e = [sh[0] + sgn*Math.sin(ua*Math.PI/180)*SEG.ua, sh[1] + Math.cos(ua*Math.PI/180)*SEG.ua];
    return [e, [e[0] + sgn*Math.sin(fa*Math.PI/180)*SEG.fa, e[1] + Math.cos(fa*Math.PI/180)*SEG.fa]]; };
  [J.elbR, J.handR] = arm(J.shoR, p.uaR ?? p.ua ?? 8, p.faR ?? p.fa ?? p.uaR ?? p.ua ?? 8, 1);
  [J.elbL, J.handL] = arm(J.shoL, p.uaL ?? p.ua ?? 8, p.faL ?? p.fa ?? p.uaL ?? p.ua ?? 8, -1);
  const leg = (h, th, sh, sgn) => {
    if (p.seated) { const k = [h[0] + sgn*(2 + Math.sin(th*Math.PI/180)*14), h[1] + 7]; return [k, [k[0] + sgn*Math.sin(sh*Math.PI/180)*4, k[1] + SEG.sh]]; }
    const k = [h[0] + sgn*Math.sin(th*Math.PI/180)*SEG.th, h[1] + Math.cos(th*Math.PI/180)*SEG.th];
    return [k, [k[0] + sgn*Math.sin(sh*Math.PI/180)*SEG.sh, k[1] + Math.cos(sh*Math.PI/180)*SEG.sh]]; };
  [J.kneeR, J.ankR] = leg(J.hipR, p.thR ?? p.th ?? 4, p.shR ?? p.sh ?? p.thR ?? p.th ?? 4, 1);
  [J.kneeL, J.ankL] = leg(J.hipL, p.thL ?? p.th ?? 4, p.shL ?? p.sh ?? p.thL ?? p.th ?? 4, -1);
  return J;
}

/* ---------- interpolación ---------- */
function glerp(A, B, k){
  const out = {};
  for (const key in B) if (!(key in A)) out[key] = B[key];
  for (const key in A) {
    const a = A[key], b = B[key];
    if (b === undefined || typeof a === 'string' || typeof a === 'boolean') out[key] = a;
    else if (Array.isArray(a) && Array.isArray(a[0])) out[key] = a;           // anchor: [joint, punto]
    else if (Array.isArray(a)) out[key] = a.map((v, i) => typeof v === 'number' ? v + (b[i] - v) * k : v);
    else out[key] = a + (b - a) * k;
  }
  return out;
}

/* ---------- dibujo ---------- */
const P2 = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const gl = (a, b, cls, w) => a && b ? `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"${w ? ` stroke-width="${w}"` : ''}/>` : '';
function gprop(pr, J){
  const at = k => typeof k === 'string' ? J[k] : k;
  switch (pr.k) {
    case 'floor': return `<line class="g-floor" x1="4" y1="110" x2="156" y2="110"/>`;
    case 'rect': return `<rect class="g-eq" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.r ?? 1.5}"/>`;
    case 'line': return `<line class="g-eqline" x1="${pr.p[0]}" y1="${pr.p[1]}" x2="${pr.p[2]}" y2="${pr.p[3]}"${pr.w ? ` stroke-width="${pr.w}"` : ''}/>`;
    case 'plate': { const c = at(pr.at); return c ? `<circle class="g-load" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${pr.r || 9}"/><circle class="g-hub" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="1.6"/>` : ''; }
    case 'db': { const c = at(pr.at); if (!c) return ''; const v = pr.v === 'h';
      return v ? `<line class="g-dbbar" x1="${(c[0]-5).toFixed(1)}" y1="${c[1].toFixed(1)}" x2="${(c[0]+5).toFixed(1)}" y2="${c[1].toFixed(1)}"/><rect class="g-load" x="${(c[0]-7).toFixed(1)}" y="${(c[1]-3.5).toFixed(1)}" width="3" height="7" rx="1"/><rect class="g-load" x="${(c[0]+4).toFixed(1)}" y="${(c[1]-3.5).toFixed(1)}" width="3" height="7" rx="1"/>`
        : `<circle class="g-load" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="4.2"/>`; }
    case 'kb': { const c = at(pr.at); return c ? `<circle class="g-load" cx="${c[0].toFixed(1)}" cy="${(c[1]+5).toFixed(1)}" r="5"/>` : ''; }
    case 'handle': { const c = at(pr.at); return c ? `<rect class="g-load" x="${(c[0]-2.5).toFixed(1)}" y="${(c[1]-2.5).toFixed(1)}" width="5" height="5" rx="1.2"/>` : ''; }
    case 'cable': { const c = at(pr.to); return c ? `<line class="g-cable" x1="${pr.from[0]}" y1="${pr.from[1]}" x2="${c[0].toFixed(1)}" y2="${c[1].toFixed(1)}"/><circle class="g-eq" cx="${pr.from[0]}" cy="${pr.from[1]}" r="3"/>` : ''; }
    case 'band': { const a = at(pr.a), b = at(pr.b); return a && b ? `<line class="g-band" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>` : ''; }
    case 'pad': { const c = at(pr.at); return c ? `<circle class="g-pad" cx="${(c[0] + (pr.dx||0)).toFixed(1)}" cy="${(c[1] + (pr.dy||0)).toFixed(1)}" r="${pr.r || 4}"/>` : ''; }
    case 'platform': { const a = J.ank, b = J.toe; if (!a) return ''; const m = [(a[0]+b[0])/2, (a[1]+b[1])/2], v = GV(pr.a), L = pr.l || 14;
      return `<line class="g-eqline" x1="${(m[0]-v[0]*L).toFixed(1)}" y1="${(m[1]-v[1]*L).toFixed(1)}" x2="${(m[0]+v[0]*L).toFixed(1)}" y2="${(m[1]+v[1]*L).toFixed(1)}" stroke-width="3.5"/>`; }
    case 'barF': { const a = J.handL, b = J.handR; return a && b ? `<line class="g-loadbar" x1="${(a[0]-8).toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${(b[0]+8).toFixed(1)}" y2="${b[1].toFixed(1)}"/><rect class="g-load" x="${(a[0]-14).toFixed(1)}" y="${(a[1]-7).toFixed(1)}" width="5" height="14" rx="1.5"/><rect class="g-load" x="${(b[0]+9).toFixed(1)}" y="${(b[1]-7).toFixed(1)}" width="5" height="14" rx="1.5"/>` : ''; }
  }
  return '';
}
const HL = {th:['hip','knee'], th2:['hip','knee2'], sh:['knee','ank'], ua:['sho','elb'], fa:['elb','hand'], torso:['hip','sho']};
const HLF = {th:[['hipL','kneeL'],['hipR','kneeR']], sh:[['kneeL','ankL'],['kneeR','ankR']], ua:[['shoL','elbL'],['shoR','elbR']], torso:[['hip','neck']], sho:[['shoL','shoL'],['shoR','shoR']]};
function gtorso(J, arch){
  if (!arch) return gl(J.hip, J.sho, 'g-body g-torso');
  const m = [(J.hip[0] + J.sho[0]) / 2, (J.hip[1] + J.sho[1]) / 2], n = GV(J.t + 90);
  const c = [m[0] - n[0]*arch, m[1] - n[1]*arch];
  return `<path class="g-body g-torso" d="M${P2(J.hip)} Q${P2(c)} ${P2(J.sho)}" fill="none"/>`;
}
function gdraw(T, k){
  const p = glerp(T.A, T.B, k), front = T.view === 'front';
  const J = front ? poseFront(p) : poseSide(p);
  const props = T.props || [], back = props.filter(x => !x.front).map(x => gprop(x, J)).join(''), fr = props.filter(x => x.front).map(x => gprop(x, J)).join('');
  let hl = '';
  for (const h of T.hl || []) {
    if (front) { for (const [a, b] of HLF[h] || []) hl += a === b ? `<circle class="g-hl" cx="${J[a][0].toFixed(1)}" cy="${J[a][1].toFixed(1)}" r="5"/>` : gl(J[a], J[b], 'g-hl'); }
    else if (h === 'hipj') hl += `<circle class="g-hl" cx="${J.hip[0].toFixed(1)}" cy="${J.hip[1].toFixed(1)}" r="6"/>`;
    else if (h === 'sho') hl += `<circle class="g-hl" cx="${J.sho[0].toFixed(1)}" cy="${J.sho[1].toFixed(1)}" r="5.5"/>`;
    else if (HL[h]) hl += gl(J[HL[h][0]], J[HL[h][1]], 'g-hl');
  }
  let body;
  if (front) {
    body = gl(J.hipL, J.kneeL, 'g-body') + gl(J.kneeL, J.ankL, 'g-body') + gl(J.hipR, J.kneeR, 'g-body') + gl(J.kneeR, J.ankR, 'g-body')
      + gl(J.hipL, J.hipR, 'g-body') + gl(J.hip, J.neck, 'g-body g-torso') + gl(J.shoL, J.shoR, 'g-body')
      + gl(J.shoL, J.elbL, 'g-body') + gl(J.elbL, J.handL, 'g-body') + gl(J.shoR, J.elbR, 'g-body') + gl(J.elbR, J.handR, 'g-body')
      + `<circle class="g-head" cx="${J.head[0].toFixed(1)}" cy="${J.head[1].toFixed(1)}" r="${SEG.head}"/>`;
  } else {
    const far = gl(J.hip, J.knee2, 'g-far') + gl(J.knee2, J.ank2, 'g-far') + gl(J.ank2, J.toe2, 'g-far g-foot') + gl(J.sho, J.elb2, 'g-far') + gl(J.elb2, J.hand2, 'g-far');
    body = far + gtorso(J, p.arch) + gl(J.sho, J.neck, 'g-body')
      + `<circle class="g-head" cx="${J.head[0].toFixed(1)}" cy="${J.head[1].toFixed(1)}" r="${SEG.head}"/>`
      + gl(J.hip, J.knee, 'g-body') + gl(J.knee, J.ank, 'g-body') + gl(J.ank, J.toe, 'g-body g-foot')
      + gl(J.sho, J.elb, 'g-body') + gl(J.elb, J.hand, 'g-body');
  }
  const inner = back + hl + body + fr;
  return T.rot ? `<g transform="rotate(${T.rot} 80 60)">${inner}</g>` : inner;
}
/* Ciclo: sube 1 s · pausa · baja 1,6 s · pausa (ritmo controlado) */
function gphase(ms, hold){
  if (hold) return 0.5 + 0.5*Math.sin(ms / 900);   // ejercicios de mantener: respiración lenta
  const c = (ms % 3400) / 3400;
  const ease = x => x < .5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2;
  if (c < .3) return ease(c / .3);
  if (c < .4) return 1;
  if (c < .88) return 1 - ease((c - .4) / .48);
  return 0;
}
let GANIM = null;
function gstop(){ if (GANIM) cancelAnimationFrame(GANIM.raf); GANIM = null; }
function gmount(el, tplKey){
  gstop();
  const T = GT[tplKey]; if (!el || !T) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = k => `<svg viewBox="${T.vb || '0 0 160 120'}" class="gfig" role="img" aria-label="Animación del ejercicio">${gdraw(T, k)}</svg>`;
  if (reduce) { el.innerHTML = `<div class="gpair">${svg(0)}${svg(T.hold ? 0.5 : 1)}</div><p class="faint" style="font-size:12px;margin:4px 0 0;text-align:center">Inicio · final</p>`; return; }
  el.innerHTML = svg(0);
  const node = el.querySelector('svg'), t0 = performance.now();
  const tick = now => { if (!node.isConnected) return gstop(); node.innerHTML = gdraw(T, gphase(now - t0, T.hold)); GANIM.raf = requestAnimationFrame(tick); };
  GANIM = {raf: requestAnimationFrame(tick)};
}

/* =====================================================================
   PLANTILLAS DE MOVIMIENTO
   ===================================================================== */
const FL = {k:'floor'};
const BENCH = [{k:'rect', x:28, y:79, w:70, h:5}, {k:'line', p:[36,84,36,110], w:3}, {k:'line', p:[90,84,90,110], w:3}];
const SEAT = (x, y, w) => ({k:'rect', x, y, w, h:5});
const GT = {
  /* ---------- pierna ---------- */
  squat_goblet:{hl:['th'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[78,60], t:180, F:[80,107], kn:'f', Hs:[9,13], el:'d'}, B:{hip:[58,84], t:138, F:[80,107], kn:'f', Hs:[9,13], el:'d'}},
  squat_bb:{hl:['th'], props:[FL, {k:'plate', at:'sho', r:10}],
    A:{hip:[78,60], t:180, F:[80,107], kn:'f', Hs:[-5,6], el:'d'}, B:{hip:[58,84], t:142, F:[80,107], kn:'f', Hs:[-5,6], el:'d'}},
  squat_front:{hl:['th'], props:[FL, {k:'plate', at:'hand', r:10}],
    A:{hip:[78,60], t:180, F:[80,107], kn:'f', Hs:[6,2], el:'fd'}, B:{hip:[62,86], t:160, F:[80,107], kn:'f', Hs:[6,2], el:'fd'}},
  squat_box:{hl:['th'], props:[FL, {k:'rect', x:42, y:88, w:22, h:22}, {k:'db', at:'hand', front:true}],
    A:{hip:[78,60], t:180, F:[82,107], kn:'f', Hs:[9,13], el:'d'}, B:{hip:[58,84], t:140, F:[82,107], kn:'f', Hs:[9,13], el:'d'}},
  squat_bw:{hl:['th'], props:[FL],
    A:{hip:[78,60], t:180, F:[80,107], kn:'f', ua:2, fa:2}, B:{hip:[58,84], t:140, F:[80,107], kn:'f', ua:92, fa:92}},
  sit_stand:{hl:['th'], props:[FL, {k:'rect', x:40, y:82, w:26, h:4}, {k:'line', p:[44,86,44,110], w:3}, {k:'line', p:[62,86,62,110], w:3}, {k:'line', p:[42,82,40,52], w:3}],
    A:{hip:[56,80], t:162, F:[82,107], kn:'f', ua:30, fa:40}, B:{hip:[78,60], t:180, F:[82,107], kn:'f', ua:4, fa:4}},
  squat_jump:{hl:['th','sh'], props:[FL],
    A:{hip:[60,84], t:140, F:[80,107], kn:'f', ua:-30, fa:-30, ft:90}, B:{hip:[80,48], t:180, F:[80,95], kn:'f', ua:170, fa:170, ft:40}},
  box_jump:{hl:['th','sh'], props:[FL, {k:'rect', x:96, y:82, w:30, h:28}],
    A:{hip:[60,84], t:140, F:[78,107], kn:'f', ua:-30, fa:-30}, B:{hip:[104,56], t:160, F:[110,80], kn:'f', ua:60, fa:60}},
  legpress:{hl:['th'], props:[{k:'line', p:[54,86,22,64], w:4}, {k:'rect', x:48, y:84, w:26, h:5}, {k:'platform', a:-135, l:15}, {k:'line', p:[100,60,138,22], w:2}],
    A:{hip:[54,82], t:-122, F:[80,60], kn:'u', ft:-135, H:[62,90], el:'d'}, B:{hip:[54,82], t:-122, F:[94,46], kn:'u', ft:-135, H:[62,90], el:'d'}},
  hinge_bb:{hl:['th'], props:[FL, {k:'plate', at:'hand', r:10}],
    A:{hip:[80,60], t:180, F:[80,107], kn:'f', Hs:[2,31], el:'f'}, B:{hip:[64,64], t:98, F:[80,107], kn:'f', Hs:[0,31], el:'f'}},
  hinge_db:{hl:['th'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[80,60], t:180, F:[80,107], kn:'f', Hs:[2,31], el:'f'}, B:{hip:[64,64], t:98, F:[80,107], kn:'f', Hs:[0,31], el:'f'}},
  deadlift:{hl:['th','torso'], props:[FL, {k:'plate', at:'hand', r:10}],
    A:{hip:[62,76], t:124, F:[82,107], kn:'f', Hs:[0,31], el:'f'}, B:{hip:[80,60], t:180, F:[82,107], kn:'f', Hs:[2,31], el:'f'}},
  goodmorning:{hl:['th'], props:[FL, {k:'plate', at:'sho', r:10}],
    A:{hip:[80,60], t:180, F:[80,107], kn:'f', Hs:[-5,6], el:'d'}, B:{hip:[66,63], t:100, F:[80,107], kn:'f', Hs:[-5,6], el:'d'}},
  sl_rdl:{hl:['th'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[80,60], t:180, F:[80,107], kn:'f', th2:0, sh2:0, Hs:[2,31], el:'f'}, B:{hip:[72,64], t:96, F:[80,107], kn:'f', th2:-88, sh2:-90, Hs:[0,31], el:'f'}},
  kb_swing:{hl:['hipj','th'], props:[FL, {k:'kb', at:'hand', front:true}],
    A:{hip:[64,66], t:104, F:[80,107], kn:'f', Hs:[-8,29], el:'f'}, B:{hip:[80,60], t:180, F:[80,107], kn:'f', Hs:[31,1], el:'f'}},
  pull_through:{hl:['hipj','th'], props:[FL, {k:'cable', from:[10,104], to:'hand'}],
    A:{hip:[66,64], t:104, F:[82,107], kn:'f', Hs:[-6,29], el:'f'}, B:{hip:[80,60], t:180, F:[82,107], kn:'f', Hs:[-2,31], el:'f'}},
  hyperext:{hl:['torso','th'], props:[{k:'line', p:[30,104,74,64], w:3}, {k:'pad', at:'hip', r:4.5, dx:3, dy:2}, FL],
    A:{hip:[72,66], t:40, th:-45, sh:-45, ft:45, ua:20, fa:20}, B:{hip:[72,66], t:135, th:-45, sh:-45, ft:45, ua:30, fa:30}},
  lunge:{hl:['th'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[74,62], t:180, F:[94,107], F2:[52,104], kn:'f', kn2:'f', ft2:60, Hs:[2,31], el:'f'}, B:{hip:[72,84], t:178, F:[94,107], F2:[52,104], kn:'f', kn2:'f', ft2:60, Hs:[2,31], el:'f'}},
  bulgarian:{hl:['th'], props:[FL, {k:'rect', x:24, y:84, w:28, h:5}, {k:'line', p:[30,89,30,110], w:3}, {k:'db', at:'hand', front:true}],
    A:{hip:[72,62], t:178, F:[94,107], F2:[42,82], kn:'f', kn2:'d', ft2:-90, Hs:[2,31], el:'f'}, B:{hip:[72,86], t:172, F:[94,107], F2:[42,82], kn:'f', kn2:'d', ft2:-90, Hs:[2,31], el:'f'}},
  stepup:{vb:'0 -16 160 136', hl:['th'], props:[FL, {k:'rect', x:84, y:86, w:30, h:24}, {k:'db', at:'hand', front:true}],
    A:{hip:[68,62], t:174, F:[94,83], F2:[64,107], kn:'f', kn2:'f', Hs:[2,31], el:'f'}, B:{hip:[92,38], t:180, F:[94,83], F2:[90,82], kn:'f', kn2:'f', Hs:[2,31], el:'f'}},
  stepdown:{vb:'0 -16 160 136', hl:['th'], props:[FL, {k:'rect', x:84, y:86, w:30, h:24}],
    A:{hip:[92,38], t:180, F:[96,83], F2:[84,93], kn:'f', kn2:'f', ua:40, fa:40}, B:{hip:[84,56], t:168, F:[96,83], F2:[76,107], kn:'f', kn2:'f', ua:60, fa:60}},
  legext:{hl:['th'], props:[{k:'rect', x:40, y:79, w:44, h:5}, {k:'line', p:[46,80,40,44], w:4}, {k:'line', p:[70,84,70,110], w:3}, {k:'pad', at:'ank', r:4.5, front:true}],
    A:{hip:[60,76], t:192, th:90, sh:6, ft:96, H:[66,84], el:'d'}, B:{hip:[60,76], t:192, th:90, sh:84, ft:176, H:[66,84], el:'d'}},
  legcurl_seat:{hl:['th'], props:[{k:'rect', x:40, y:79, w:44, h:5}, {k:'line', p:[46,80,40,44], w:4}, {k:'rect', x:74, y:66, w:14, h:5}, {k:'pad', at:'ank', r:4.5, dx:0, dy:4, front:true}],
    A:{hip:[60,76], t:192, th:90, sh:86, ft:176, H:[70,64], el:'u'}, B:{hip:[60,76], t:192, th:90, sh:-12, ft:80, H:[70,64], el:'u'}},
  legcurl_lie:{hl:['th'], props:[{k:'rect', x:24, y:84, w:82, h:5}, {k:'line', p:[34,89,34,110], w:3}, {k:'line', p:[96,89,96,110], w:3}, {k:'pad', at:'ank', r:4.5, dy:-4, front:true}],
    A:{hip:[72,80], t:-90, th:90, sh:92, ft:4, H:[30,96], el:'d', nk:-20}, B:{hip:[72,80], t:-90, th:90, sh:202, ft:110, H:[30,96], el:'d', nk:-20}},
  nordic:{hl:['th'], props:[FL, {k:'pad', at:'ank', r:4, dy:-5}],
    A:{hip:[60,82], t:180, th:0, sh:-90, ft:-90, ua:4, fa:4, anchor:['knee',[60,106]]}, B:{hip:[60,82], t:128, th:-52, sh:-90, ft:-90, ua:70, fa:80, anchor:['knee',[60,106]]}},
  calf:{hl:['sh'], props:[FL, {k:'rect', x:84, y:102, w:28, h:8}, {k:'db', at:'hand', front:true}],
    A:{hip:[80,60], t:180, th:0, sh:0, ft:90, Hs:[0,31], el:'f', anchor:['toe',[90,101]]}, B:{hip:[80,60], t:180, th:0, sh:0, ft:52, Hs:[0,31], el:'f', anchor:['toe',[90,101]]}},
  calf_seat:{hl:['sh'], props:[FL, {k:'rect', x:36, y:80, w:36, h:5}, {k:'pad', at:'knee', r:4.5, dy:-5, front:true}],
    A:{hip:[60,76], t:180, th:90, sh:0, ft:90, H:[76,72], el:'d', anchor:['toe',[92,107]]}, B:{hip:[60,76], t:180, th:90, sh:0, ft:55, H:[76,72], el:'d', anchor:['toe',[92,107]]}},
  wallsit:{hold:true, hl:['th'], props:[FL, {k:'line', p:[54,20,54,110], w:3}],
    A:{hip:[58,84], t:180, th:90, sh:0, ft:90, ua:20, fa:20}, B:{hip:[58,85], t:180, th:90, sh:0, ft:90, ua:20, fa:20}},
  tke:{hl:['th'], props:[FL, {k:'band', a:'knee', b:[140,84]}],
    A:{hip:[76,63], t:176, F:[80,107], kn:'f', ua:4, fa:4}, B:{hip:[80,60], t:180, F:[80,107], kn:'f', ua:4, fa:4}},
  hipthrust:{hl:['hipj'], props:[FL, {k:'rect', x:22, y:78, w:26, h:8}, {k:'plate', at:'hip', r:9, front:true}],
    A:{hip:[66,98], S:[44,80], F:[94,107], kn:'u', Hh:[0,-6], el:'d'}, B:{hip:[72,80], S:[44,78], F:[94,107], kn:'u', Hh:[0,-6], el:'d'}},
  bridge:{hl:['hipj'], props:[FL],
    A:{hip:[64,104], S:[34,104], F:[88,107], kn:'u', ua:90, fa:90, nk:0}, B:{hip:[68,86], S:[34,102], F:[88,107], kn:'u', ua:96, fa:96, nk:0}},
  bridge_sl:{hl:['hipj'], props:[FL],
    A:{hip:[64,104], S:[34,104], F:[88,107], kn:'u', F2:[104,92], ua:90, fa:90, nk:0}, B:{hip:[68,86], S:[34,102], F:[88,107], kn:'u', F2:[110,70], ua:96, fa:96, nk:0}},

  /* ---------- pecho / empuje ---------- */
  bench_bb:{hl:['torso','ua'], props:[FL, ...BENCH, {k:'plate', at:'hand', r:10, front:true}],
    A:{hip:[78,74], S:[46,74], H:[50,62], el:'d', F:[102,107], kn:'u', nk:0}, B:{hip:[78,74], S:[46,74], H:[48,43], el:'d', F:[102,107], kn:'u', nk:0}},
  bench_db:{hl:['torso','ua'], props:[FL, ...BENCH, {k:'db', at:'hand', v:'h', front:true}],
    A:{hip:[78,74], S:[46,74], H:[52,64], el:'d', F:[102,107], kn:'u'}, B:{hip:[78,74], S:[46,74], H:[48,43], el:'d', F:[102,107], kn:'u'}},
  incline_db:{hl:['torso','ua'], props:[FL, {k:'rect', x:58, y:80, w:28, h:5}, {k:'line', p:[60,82,30,52], w:5}, {k:'line', p:[72,85,72,110], w:3}, {k:'db', at:'hand', v:'h', front:true}],
    A:{hip:[70,77], S:[48,54], H:[56,48], el:'d', F:[102,107], kn:'u'}, B:{hip:[70,77], S:[48,54], H:[54,23], el:'d', F:[102,107], kn:'u'}},
  incline_bb:{hl:['torso','ua'], props:[FL, {k:'rect', x:58, y:80, w:28, h:5}, {k:'line', p:[60,82,30,52], w:5}, {k:'line', p:[72,85,72,110], w:3}, {k:'plate', at:'hand', r:10, front:true}],
    A:{hip:[70,77], S:[48,54], H:[56,46], el:'d', F:[102,107], kn:'u'}, B:{hip:[70,77], S:[48,54], H:[54,23], el:'d', F:[102,107], kn:'u'}},
  press_mach:{hl:['torso','ua'], props:[FL, {k:'rect', x:42, y:79, w:28, h:5}, {k:'line', p:[46,80,42,40], w:5}, {k:'line', p:[56,84,56,110], w:3}, {k:'handle', at:'hand', front:true}],
    A:{hip:[56,76], t:184, H:[62,46], el:'bd', F:[86,107], kn:'f'}, B:{hip:[56,76], t:184, H:[86,46], el:'bd', F:[86,107], kn:'f'}},
  fly_mach:{view:'front', hl:['torso'], props:[{k:'rect', x:68, y:66, w:24, h:4}, {k:'handle', at:'handL', front:true}, {k:'handle', at:'handR', front:true}],
    A:{cx:80, hy:66, seated:true, ua:88, fa:96}, B:{cx:80, hy:66, seated:true, ua:42, fa:-86}},
  fly_cable:{view:'front', hl:['torso'], props:[FL, {k:'cable', from:[22,14], to:'handL'}, {k:'cable', from:[138,14], to:'handR'}],
    A:{cx:80, hy:60, ua:88, fa:92, th:6}, B:{cx:80, hy:60, ua:40, fa:-80, th:6}},
  fly_db:{hl:['torso'], props:[FL, ...BENCH, {k:'db', at:'hand', v:'h', front:true}],
    A:{hip:[78,74], S:[46,74], H:[46,92], el:'u', F:[102,107], kn:'u'}, B:{hip:[78,74], S:[46,74], H:[48,46], el:'f', F:[102,107], kn:'u'}},
  pushup:{hl:['torso','ua'], props:[FL],
    A:{hip:[67,90], S:[100,77], H:[100,107], el:'b', F:[24,107], kn:'d', ft:30}, B:{hip:[70,100], S:[100,95], H:[100,107], el:'b', F:[24,107], kn:'d', ft:30}},
  pushup_knee:{hl:['torso','ua'], props:[FL],
    A:{hip:[72.8,94], S:[100,78], H:[100,107], el:'b', th:-60, sh:-150, ft:-60}, B:{hip:[74.6,97.8], S:[100,94], H:[100,107], el:'b', th:-70, sh:-150, ft:-60}},
  pushup_inc:{hl:['torso','ua'], props:[FL, {k:'rect', x:96, y:76, w:30, h:5}, {k:'line', p:[100,81,100,110], w:3}, {k:'line', p:[122,81,122,110], w:3}],
    A:{hip:[62,74], S:[96,48], H:[104,76], el:'b', F:[30,107], kn:'d', ft:40}, B:{hip:[66,80], S:[98,60], H:[104,76], el:'b', F:[30,107], kn:'d', ft:40}},
  dip:{hl:['torso','ua'], props:[{k:'rect', x:70, y:63, w:24, h:4}, {k:'line', p:[90,67,90,110], w:3}, FL],
    A:{hip:[78,65], S:[80,33], H:[82,64], el:'b', th:12, sh:-50, ft:20}, B:{hip:[72,80], S:[77,48], H:[82,64], el:'b', th:16, sh:-50, ft:20}},
  bench_dip:{hl:['ua'], props:[FL, {k:'rect', x:30, y:70, w:30, h:5}, {k:'line', p:[34,75,34,110], w:3}],
    A:{hip:[64,68], S:[62,36], H:[54,70], el:'b', F:[110,107], kn:'u'}, B:{hip:[64,86], S:[62,54], H:[54,70], el:'b', F:[110,107], kn:'u'}},
  ohp:{view:'front', hl:['sho'], props:[FL, {k:'db', at:'handL', v:'h', front:true}, {k:'db', at:'handR', v:'h', front:true}],
    A:{cx:80, hy:62, ua:96, fa:178, th:5}, B:{cx:80, hy:62, ua:164, fa:172, th:5}},
  ohp_bb:{view:'front', hl:['sho'], props:[FL, {k:'barF', front:true}],
    A:{cx:80, hy:62, ua:98, fa:176, th:5}, B:{cx:80, hy:62, ua:164, fa:172, th:5}},
  ohp_mach:{view:'front', hl:['sho'], props:[{k:'rect', x:62, y:68, w:36, h:5}, {k:'handle', at:'handL', front:true}, {k:'handle', at:'handR', front:true}],
    A:{cx:80, hy:66, seated:true, ua:96, fa:178}, B:{cx:80, hy:66, seated:true, ua:162, fa:172}},
  latraise:{view:'front', hl:['sho'], props:[FL, {k:'db', at:'handL', front:true}, {k:'db', at:'handR', front:true}],
    A:{cx:80, hy:62, ua:12, fa:16, th:5}, B:{cx:80, hy:62, ua:88, fa:92, th:5}},
  latraise_cable:{view:'front', hl:['sho'], props:[FL, {k:'cable', from:[56,104], to:'handR'}, {k:'handle', at:'handR', front:true}],
    A:{cx:80, hy:62, uaR:-14, faR:-14, uaL:6, faL:6, th:5}, B:{cx:80, hy:62, uaR:84, faR:88, uaL:6, faL:6, th:5}},
  frontraise:{hl:['sho'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[78,60], t:180, F:[80,107], ua:6, fa:6}, B:{hip:[78,60], t:182, F:[80,107], ua:92, fa:92}},
  uprightrow:{view:'front', hl:['sho'], props:[FL, {k:'barF', front:true}],
    A:{cx:80, hy:62, ua:8, fa:-10, th:5}, B:{cx:80, hy:62, ua:92, fa:-45, th:5}},
  shrug:{view:'front', hl:['sho'], props:[FL, {k:'db', at:'handL', front:true}, {k:'db', at:'handR', front:true}],
    A:{cx:80, hy:62, ua:8, fa:6, th:5, el:0}, B:{cx:80, hy:62, ua:8, fa:6, th:5, el:-5}},
  rearfly:{view:'front', hl:['sho'], props:[FL, {k:'db', at:'handL', front:true}, {k:'db', at:'handR', front:true}],
    A:{cx:80, hy:62, ua:14, fa:8, th:5}, B:{cx:80, hy:62, ua:90, fa:94, th:5}},
  extrot:{view:'front', hl:['sho'], props:[FL, {k:'cable', from:[40,46], to:'handR'}],
    A:{cx:80, hy:62, uaR:8, faR:-70, uaL:6, faL:6, th:5}, B:{cx:80, hy:62, uaR:8, faR:72, uaL:6, faL:6, th:5}},
  facepull:{hl:['sho'], props:[FL, {k:'cable', from:[150,26], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[70,60], t:176, F:[74,107], H:[100,30], el:'bu'}, B:{hip:[70,60], t:182, F:[74,107], H:[80,22], el:'bu'}},
  landmine_press:{hl:['sho','torso'], props:[FL, {k:'line', p:[20,108,0,108], w:3}, {k:'plate', at:'hand', r:7, front:true}],
    A:{hip:[70,62], t:172, F:[78,107], H:[80,34], el:'d'}, B:{hip:[70,62], t:168, F:[78,107], H:[104,16], el:'d'}},

  /* ---------- espalda / tirón ---------- */
  row_cable:{hl:['torso','ua'], props:[{k:'rect', x:38, y:84, w:30, h:5}, {k:'line', p:[100,84,100,104], w:4}, FL, {k:'cable', from:[150,78], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[54,82], t:168, H:[88,56], el:'b', F:[98,94], kn:'u', ft:180}, B:{hip:[54,82], t:186, H:[66,64], el:'b', F:[98,94], kn:'u', ft:180}},
  row_mach:{hl:['torso','ua'], props:[{k:'rect', x:38, y:84, w:30, h:5}, {k:'rect', x:76, y:48, w:5, h:20}, FL, {k:'handle', at:'hand', front:true}],
    A:{hip:[54,82], t:182, H:[88,58], el:'b', F:[84,107], kn:'f'}, B:{hip:[54,82], t:186, H:[64,64], el:'b', F:[84,107], kn:'f'}},
  row_bb:{hl:['torso','ua'], props:[FL, {k:'plate', at:'hand', r:10, front:true}],
    A:{hip:[62,64], t:112, F:[80,107], kn:'f', Hs:[0,31], el:'bu'}, B:{hip:[62,64], t:112, F:[80,107], kn:'f', Hs:[-7,13], el:'bu'}},
  row_db:{hl:['torso','ua'], props:[FL, {k:'rect', x:70, y:72, w:40, h:5}, {k:'line', p:[76,77,76,110], w:3}, {k:'line', p:[104,77,104,110], w:3}, {k:'db', at:'hand', front:true}],
    A:{hip:[58,64], t:102, F:[66,107], kn:'f', Hs:[0,31], el:'bu', H2:[96,72], el2:'f'}, B:{hip:[58,64], t:102, F:[66,107], kn:'f', Hs:[-8,13], el:'bu', H2:[96,72], el2:'f'}},
  row_inc:{hl:['torso','ua'], props:[FL, {k:'line', p:[46,96,88,54], w:5}, {k:'line', p:[60,92,60,110], w:3}, {k:'db', at:'hand', front:true}],
    A:{hip:[56,84], S:[82,58], F:[44,107], kn:'b', Hs:[0,31], el:'bu'}, B:{hip:[56,84], S:[82,58], F:[44,107], kn:'b', Hs:[-8,13], el:'bu'}},
  row_tbar:{hl:['torso','ua'], props:[FL, {k:'line', p:[20,108,0,108], w:3}, {k:'plate', at:'hand', r:10, front:true}],
    A:{hip:[60,64], t:116, F:[78,107], kn:'f', Hs:[2,31], el:'bu'}, B:{hip:[60,64], t:118, F:[78,107], kn:'f', Hs:[-6,14], el:'bu'}},
  row_inv:{hl:['torso','ua'], props:[FL, {k:'line', p:[90,58,116,58], w:4}, {k:'line', p:[112,58,112,110], w:3}],
    A:{hip:[60,96], S:[94,90], H:[100,59], el:'bd', F:[18,107], kn:'u', ft:180}, B:{hip:[60,84], S:[94,70], H:[100,59], el:'bd', F:[18,107], kn:'u', ft:180}},
  pulldown:{hl:['torso','ua'], props:[{k:'rect', x:48, y:84, w:30, h:5}, {k:'rect', x:84, y:74, w:14, h:5}, {k:'line', p:[64,89,64,110], w:3}, FL, {k:'cable', from:[74,0], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[64,82], t:180, H:[68,20], el:'bd', th:90, sh:0}, B:{hip:[64,82], t:190, H:[70,44], el:'bd', th:90, sh:0}},
  pullup:{hl:['torso','ua'], props:[{k:'line', p:[56,5,108,5], w:4}],
    A:{hip:[80,68], S:[80,36], H:[82,6], el:'fd', th:6, sh:-24, ft:30}, B:{hip:[78,50], S:[80,19], H:[82,6], el:'fd', th:8, sh:-30, ft:30}},
  pullup_assist:{hl:['torso','ua'], props:[{k:'line', p:[56,5,108,5], w:4}, {k:'pad', at:'knee', r:5, dy:5}],
    A:{hip:[80,68], S:[80,36], H:[82,6], el:'fd', th:0, sh:-90, ft:-90}, B:{hip:[80,52], S:[80,20], H:[82,6], el:'fd', th:0, sh:-90, ft:-90}},
  straight_pd:{hl:['torso'], props:[FL, {k:'cable', from:[120,2], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[70,60], t:164, F:[74,107], kn:'f', ua:140, fa:142}, B:{hip:[70,60], t:164, F:[74,107], kn:'f', ua:12, fa:12}},
  pullover:{hl:['torso'], props:[FL, ...BENCH, {k:'db', at:'hand', v:'h', front:true}],
    A:{hip:[78,74], S:[46,74], ua:-110, fa:-110, F:[102,107], kn:'u'}, B:{hip:[78,74], S:[46,74], ua:-170, fa:-175, F:[102,107], kn:'u'}},
  superman:{hl:['torso'], props:[FL],
    A:{hip:[84,104], t:-92, ua:-92, fa:-92, th:91, sh:91, ft:0, nk:0}, B:{hip:[84,104], t:-100, ua:-112, fa:-112, th:84, sh:84, ft:0, nk:-10}},

  /* ---------- brazos ---------- */
  curl:{hl:['ua'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[78,60], t:180, F:[80,107], ua:2, fa:4}, B:{hip:[78,60], t:180, F:[80,107], ua:8, fa:150}},
  curl_cable:{hl:['ua'], props:[FL, {k:'cable', from:[110,106], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[76,60], t:178, F:[78,107], ua:4, fa:8}, B:{hip:[76,60], t:178, F:[78,107], ua:8, fa:152}},
  curl_preacher:{hl:['ua'], props:[{k:'rect', x:46, y:82, w:26, h:5}, {k:'line', p:[66,56,90,80], w:5}, {k:'line', p:[80,72,80,110], w:3}, FL, {k:'plate', at:'hand', r:7, front:true}],
    A:{hip:[58,80], t:178, ua:44, fa:46, F:[84,107], kn:'f'}, B:{hip:[58,80], t:178, ua:44, fa:162, F:[84,107], kn:'f'}},
  curl_incline:{hl:['ua'], props:[FL, {k:'rect', x:58, y:80, w:28, h:5}, {k:'line', p:[60,82,30,52], w:5}, {k:'db', at:'hand', front:true}],
    A:{hip:[70,77], S:[48,54], ua:0, fa:0, F:[102,107], kn:'u'}, B:{hip:[70,77], S:[48,54], ua:4, fa:140, F:[102,107], kn:'u'}},
  curl_conc:{hl:['ua'], props:[FL, {k:'rect', x:40, y:80, w:30, h:5}, {k:'db', at:'hand', front:true}],
    A:{hip:[56,78], t:150, ua:20, fa:16, th:90, sh:0}, B:{hip:[56,78], t:150, ua:24, fa:150, th:90, sh:0}},
  pushdown:{hl:['ua'], props:[FL, {k:'cable', from:[96,0], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[72,60], t:174, F:[76,107], kn:'f', ua:2, fa:122}, B:{hip:[72,60], t:174, F:[76,107], kn:'f', ua:4, fa:4}},
  ohext:{hl:['ua'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[78,60], t:180, F:[80,107], ua:172, fa:-28}, B:{hip:[78,60], t:180, F:[80,107], ua:172, fa:174}},
  ohext_cable:{hl:['ua'], props:[FL, {k:'cable', from:[16,40], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[70,62], t:158, F:[96,107], F2:[56,105], kn:'f', ua:150, fa:-40}, B:{hip:[70,62], t:158, F:[96,107], F2:[56,105], kn:'f', ua:150, fa:146}},
  skull:{hl:['ua'], props:[FL, ...BENCH, {k:'plate', at:'hand', r:7, front:true}],
    A:{hip:[78,74], S:[46,74], ua:-165, fa:-96, F:[102,107], kn:'u'}, B:{hip:[78,74], S:[46,74], ua:-165, fa:-168, F:[102,107], kn:'u'}},
  kickback:{hl:['ua'], props:[FL, {k:'rect', x:70, y:72, w:40, h:5}, {k:'db', at:'hand', front:true}],
    A:{hip:[58,64], t:104, F:[66,107], kn:'f', ua:-82, fa:0, H2:[96,72], el2:'f'}, B:{hip:[58,64], t:104, F:[66,107], kn:'f', ua:-82, fa:-80, H2:[96,72], el2:'f'}},

  /* ---------- core ---------- */
  crunch:{hl:['torso'], props:[FL],
    A:{hip:[86,104], t:-94, F:[106,107], kn:'u', Hs:[4,-7], el:'u', nk:-6}, B:{hip:[86,104], t:-126, F:[106,107], kn:'u', Hs:[4,-7], el:'u', nk:-14}},
  crunch_cable:{hl:['torso'], props:[FL, {k:'cable', from:[104,0], to:'hand'}],
    A:{hip:[74,80], t:172, th:2, sh:-88, ft:-90, Hs:[6,-4], el:'d', anchor:['knee',[74,106]]}, B:{hip:[74,80], t:112, th:4, sh:-88, ft:-90, Hs:[6,-4], el:'d', anchor:['knee',[74,106]]}},
  crunch_mach:{hl:['torso'], props:[{k:'rect', x:42, y:80, w:30, h:5}, FL, {k:'handle', at:'hand', front:true}],
    A:{hip:[58,78], t:182, Hs:[8,2], el:'d', F:[86,107], kn:'f'}, B:{hip:[58,78], t:140, Hs:[8,2], el:'d', F:[86,107], kn:'f'}},
  legraise:{hl:['torso'], props:[FL],
    A:{hip:[74,104], t:-90, th:96, sh:96, ft:180, ua:90, fa:90, nk:0}, B:{hip:[74,104], t:-90, th:176, sh:176, ft:90, ua:90, fa:90, nk:0}},
  hangraise:{hl:['torso'], props:[{k:'line', p:[56,5,108,5], w:4}],
    A:{hip:[80,68], S:[80,36], H:[82,6], el:'f', th:0, sh:0, ft:60}, B:{hip:[80,68], S:[80,36], H:[82,6], el:'f', th:92, sh:92, ft:160}},
  plank:{hold:true, hl:['torso'], props:[FL],
    A:{hip:[64,98], S:[96,91], ua:0, fa:90, F:[20,107], kn:'d', ft:20}, B:{hip:[64,96], S:[96,91], ua:0, fa:90, F:[20,107], kn:'d', ft:20}},
  deadbug:{hl:['torso'], props:[FL],
    A:{hip:[86,102], t:-90, ua:180, fa:180, ua2:180, fa2:180, th:180, sh:90, th2:180, sh2:90, ft:180, nk:0}, B:{hip:[86,102], t:-90, ua:246, fa:246, ua2:180, fa2:180, th:96, sh:96, th2:180, sh2:90, ft:180, nk:0}},
  birddog:{hl:['torso'], props:[FL],
    A:{hip:[56,82], S:[88,82], ua:0, fa:0, H2:[88,107], th:0, sh:-90, ft:-90, th2:0, sh2:-90}, B:{hip:[56,82], S:[88,82], ua:94, fa:94, H2:[88,107], th:0, sh:-90, ft:-90, th2:-88, sh2:-88}},
  hollow:{hold:true, hl:['torso'], props:[FL],
    A:{hip:[80,104], t:-112, ua:-118, fa:-118, th:104, sh:104, ft:180, nk:-10}, B:{hip:[80,104], t:-114, ua:-120, fa:-120, th:106, sh:106, ft:180, nk:-10}},
  twist:{view:'front', hl:['torso'], props:[FL],
    A:{cx:80, hy:88, seated:true, uaR:60, faR:-40, uaL:-20, faL:-70}, B:{cx:80, hy:88, seated:true, uaR:-20, faR:-70, uaL:60, faL:-40}},
  pallof:{hl:['torso'], props:[FL, {k:'cable', from:[150,52], to:'hand'}, {k:'handle', at:'hand', front:true}],
    A:{hip:[72,60], t:180, F:[74,107], kn:'f', Hs:[8,16], el:'d'}, B:{hip:[72,60], t:180, F:[74,107], kn:'f', Hs:[31,12], el:'d'}},
  mountain:{hl:['torso','th'], props:[FL],
    A:{hip:[66,86], S:[98,72], H:[100,107], el:'b', F:[26,107], kn:'d', F2:[26,107], ft:30}, B:{hip:[66,86], S:[98,72], H:[100,107], el:'b', F:[70,100], kn:'d', F2:[26,107], ft:30}},
  carry:{hl:['torso'], props:[FL, {k:'db', at:'hand', front:true}],
    A:{hip:[78,61], t:180, F:[92,107], F2:[66,107], Hs:[0,31], el:'f'}, B:{hip:[78,61], t:180, F:[66,107], F2:[92,107], Hs:[0,31], el:'f'}},

  /* ---------- cardio / explosivo ---------- */
  jack:{view:'front', hl:[], props:[FL],
    A:{cx:80, hy:62, ua:10, fa:10, th:3}, B:{cx:80, hy:58, ua:168, fa:170, th:18}},
  burpee:{hl:['torso','th'], props:[FL],
    A:{hip:[60,84], S:[81,60], F:[80,107], kn:'f', H:[94,107], el:'b'}, B:{hip:[64,92], S:[96,78], H:[96,107], el:'b', F:[22,107], kn:'d'}},

  /* ---------- cadera (vista de frente) ---------- */
  abduction:{view:'front', hl:['th'], props:[{k:'rect', x:62, y:66, w:36, h:5}, {k:'pad', at:'kneeL', r:3.5, dx:-4}, {k:'pad', at:'kneeR', r:3.5, dx:4}],
    A:{cx:80, hy:64, seated:true, th:4, sh:4, ua:20, fa:20}, B:{cx:80, hy:64, seated:true, th:75, sh:30, ua:20, fa:20}},
  adduction:{view:'front', hl:['th'], props:[{k:'rect', x:62, y:66, w:36, h:5}, {k:'pad', at:'kneeL', r:3.5, dx:4}, {k:'pad', at:'kneeR', r:3.5, dx:-4}],
    A:{cx:80, hy:64, seated:true, th:75, sh:30, ua:20, fa:20}, B:{cx:80, hy:64, seated:true, th:4, sh:4, ua:20, fa:20}},
  bandwalk:{view:'front', hl:['th'], props:[FL, {k:'band', a:'kneeL', b:'kneeR'}],
    A:{cx:74, hy:66, th:8, sh:2, ua:20, fa:30}, B:{cx:84, hy:66, th:18, sh:8, ua:20, fa:30}},
  sidelying:{view:'front', rot:-90, hl:['th'], props:[],
    A:{cx:80, hy:60, thL:2, thR:4, ua:170, fa:170}, B:{cx:80, hy:60, thL:2, thR:40, ua:170, fa:170}},
  latlunge:{view:'front', hl:['th'], props:[FL],
    A:{cx:80, hy:62, thL:12, shL:12, thR:12, shR:12, ua:30, fa:60}, B:{cx:70, hy:76, thL:30, shL:-14, thR:50, shR:50, ua:30, fa:60}},

  /* ---------- movilidad (mantener) ---------- */
  hipflexor:{hold:true, hl:['th2'], props:[FL],
    A:{hip:[72,82], t:182, F:[98,107], kn:'f', th2:-34, sh2:-90, ft2:-90, ua:180, fa:180}, B:{hip:[76,83], t:186, F:[98,107], kn:'f', th2:-40, sh2:-90, ft2:-90, ua:182, fa:182}},
  hamstring:{hold:true, hl:['th'], props:[FL],
    A:{hip:[50,103], t:150, th:90, sh:90, ft:180, ua:110, fa:110}, B:{hip:[50,103], t:126, th:90, sh:90, ft:180, ua:100, fa:100}},
  hip9090:{hold:true, hl:['hipj'], props:[FL],
    A:{hip:[64,102], t:170, th:90, sh:180, ft:90, th2:-90, sh2:0, H:[76,108], el:'f'}, B:{hip:[64,102], t:140, th:90, sh:180, ft:90, th2:-90, sh2:0, H:[86,108], el:'f'}},
  catcow:{hl:['torso'], props:[FL],
    A:{hip:[56,82], S:[88,82], H:[88,107], el:'b', th:0, sh:-90, ft:-90, arch:-6, nk:-30}, B:{hip:[56,82], S:[88,82], H:[88,107], el:'b', th:0, sh:-90, ft:-90, arch:7, nk:30}},
  childpose:{hold:true, hl:['torso'], props:[FL],
    A:{hip:[56,94], t:72, th:60, sh:-90, ft:-90, ua:90, fa:90, nk:10, anchor:['knee',[74,106]]}, B:{hip:[56,94], t:76, th:60, sh:-90, ft:-90, ua:92, fa:92, nk:10, anchor:['knee',[74,106]]}},
  calfstretch:{hold:true, hl:['sh2'], props:[FL, {k:'line', p:[118,10,118,110], w:3}],
    A:{hip:[90,64], t:160, F:[104,107], kn:'f', F2:[50,107], ft2:90, H:[116,40], el:'d'}, B:{hip:[92,66], t:158, F:[104,107], kn:'f', F2:[50,107], ft2:90, H:[116,40], el:'d'}},
  pecstretch:{hold:true, hl:['torso'], props:[FL, {k:'line', p:[66,10,66,110], w:3}],
    A:{hip:[78,60], t:182, F:[84,107], ua:-90, fa:180}, B:{hip:[80,60], t:186, F:[84,107], ua:-92, fa:180}},
  deepsquat:{hold:true, hl:['th'], props:[FL],
    A:{hip:[62,94], t:150, F:[80,107], kn:'f', ua:70, fa:150}, B:{hip:[62,95], t:150, F:[80,107], kn:'f', ua:70, fa:150}},
  tspine:{hl:['torso'], props:[FL],
    A:{hip:[56,82], S:[88,82], H:[88,107], el:'b', th:0, sh:-90, ft:-90, ua2:0, fa2:0}, B:{hip:[56,82], S:[88,80], H:[88,107], el:'b', th:0, sh:-90, ft:-90, ua2:160, fa2:160}},
  walk:{hl:['th'], props:[FL],
    A:{hip:[78,61], t:178, F:[94,107], F2:[64,106], ua:-24, fa:-10, ua2:24, fa2:40, ft:90, ft2:60}, B:{hip:[78,61], t:178, F:[64,106], F2:[94,107], ua:24, fa:40, ua2:-24, fa2:-10, ft:60, ft2:90}}
};

/* =====================================================================
   QUÉ PLANTILLA USA CADA EJERCICIO (nombre de Hevy → animación)
   ===================================================================== */
const GMAP = {
 'Incline Bench Press (Dumbbell)':'incline_db', 'Bench Press (Barbell)':'bench_bb', 'Bench Press (Dumbbell)':'bench_db', 'Chest Press (Machine)':'press_mach',
 'Iso-Lateral Chest Press (Machine)':'press_mach', 'Incline Chest Press (Machine)':'press_mach', 'Incline Bench Press (Smith Machine)':'incline_bb', 'Push Up':'pushup',
 'Chest Fly (Machine)':'fly_mach', 'Cable Fly Crossovers':'fly_cable', 'Incline Chest Fly (Dumbbell)':'fly_db', 'Chest Dip':'dip', 'Seated Dip Machine':'dip',
 'Lateral Raise (Dumbbell)':'latraise', 'Lateral Raise (Machine)':'latraise', 'Single Arm Lateral Raise (Cable)':'latraise_cable', 'Lateral Raise (Band)':'latraise',
 'Shoulder Press (Dumbbell)':'ohp', 'Chest Supported Reverse Fly (Dumbbell)':'rearfly', 'Reverse Fly (Dumbbell)':'rearfly', 'Reverse Fly Single Arm (Cable)':'rearfly',
 'Rear Delt Reverse Fly (Machine)':'rearfly', 'Face Pull':'facepull', 'Band Pull Apart':'rearfly',
 'Triceps Pushdown':'pushdown', 'Triceps Rope Pushdown':'pushdown', 'Single Arm Triceps Pushdown (Cable)':'pushdown', 'Overhead Triceps Extension (Cable)':'ohext_cable',
 'Overhead Triceps Extension (Dumbbell)':'ohext', 'Triceps Extension (Cable)':'pushdown', 'Skullcrusher (Barbell)':'skull', 'Skullcrusher (Dumbbell)':'skull', 'Bench Dip':'bench_dip',
 'Pull Up':'pullup', 'Lat Pulldown (Cable)':'pulldown', 'Single Arm Lat Pulldown':'pulldown', 'Straight Arm Lat Pulldown (Cable)':'straight_pd',
 'Seated Row (Machine)':'row_mach', 'Iso-Lateral Row (Machine)':'row_mach', 'Iso-Lateral Low Row':'row_mach', 'Seated Cable Row - V Grip (Cable)':'row_cable', 'T Bar Row':'row_tbar',
 'Chest Supported Incline Row (Dumbbell)':'row_inc', 'Dumbbell Row':'row_db', 'Back Extension (Hyperextension)':'hyperext',
 'Bicep Curl (Cable)':'curl_cable', 'Hammer Curl (Cable)':'curl_cable', 'Cross Body Hammer Curl':'curl', 'Bicep Curl (Dumbbell)':'curl', 'Preacher Curl (Barbell)':'curl_preacher',
 'Behind the Back Curl (Cable)':'curl_cable', 'Romanian Deadlift (Barbell)':'hinge_bb', 'Romanian Deadlift (Dumbbell)':'hinge_db', 'Leg Press (Machine)':'legpress',
 'Leg Press Horizontal (Machine)':'legpress', 'Single Leg Press (Machine)':'legpress', 'Goblet Box Squat':'squat_box', 'Step Up (Dumbbell)':'stepup', 'Leg Extension (Machine)':'legext',
 'Terminal Knee Extension (Band)':'tke', 'Seated Leg Curl (Machine)':'legcurl_seat', 'Hip Abduction (Machine)':'abduction', 'Band Lateral Walk':'bandwalk', 'Glute Bridge':'bridge',
 'Hip Adduction (Machine)':'adduction', 'Single Leg Standing Calf Raise (Machine)':'calf', 'Calf Raise (Dumbbell)':'calf', 'Crunch (Machine)':'crunch_mach', 'Cable Crunch':'crunch_cable',
 'Dead Bug':'deadbug', 'Hip Thrust (Barbell)':'hipthrust', 'Hip Thrust (Machine)':'hipthrust', 'Bulgarian Split Squat':'bulgarian', 'Reverse Lunge (Dumbbell)':'lunge',
 'Lying Leg Curl (Machine)':'legcurl_lie', 'Seated Calf Raise':'calf_seat', 'Incline Curl (Dumbbell)':'curl_incline', 'Wall Sit':'wallsit', 'Spanish Squat':'wallsit',
 'Plank':'plank', 'Side Plank':'plank', 'Chin Up':'pullup',
 'Incline Bench Press (Barbell)':'incline_bb', 'Decline Bench Press (Barbell)':'bench_bb', 'Bench Press (Smith Machine)':'bench_bb', 'Chest Fly (Dumbbell)':'fly_db',
 'Low Cable Fly Crossovers':'fly_cable', 'Incline Push Up':'pushup_inc', 'Knee Push Up':'pushup_knee', 'Decline Push Up':'pushup', 'Diamond Push Up':'pushup',
 'Pullover (Dumbbell)':'pullover', 'Landmine Press':'landmine_press', 'Overhead Press (Barbell)':'ohp_bb', 'Shoulder Press (Machine)':'ohp_mach', 'Arnold Press (Dumbbell)':'ohp',
 'Front Raise (Dumbbell)':'frontraise', 'Front Raise (Cable)':'frontraise', 'Upright Row (Cable)':'uprightrow', 'Shrug (Dumbbell)':'shrug', 'Shrug (Barbell)':'shrug',
 'External Rotation (Cable)':'extrot', 'Bent Over Row (Barbell)':'row_bb', 'Pendlay Row (Barbell)':'row_bb', 'Lat Pulldown - Close Grip (Cable)':'pulldown',
 'Reverse Grip Lat Pulldown (Cable)':'pulldown', 'Assisted Pull Up':'pullup_assist', 'Inverted Row':'row_inv', 'Seated Cable Row - Bar Wide Grip':'row_cable', 'Meadows Row':'row_tbar',
 'Deadlift (Barbell)':'deadlift', 'Trap Bar Deadlift':'deadlift', 'Good Morning (Barbell)':'goodmorning', 'Single Leg Romanian Deadlift (Dumbbell)':'sl_rdl',
 'Kettlebell Swing':'kb_swing', 'Cable Pull Through':'pull_through', 'Superman':'superman', 'EZ Bar Curl':'curl', 'Hammer Curl (Dumbbell)':'curl', 'Concentration Curl':'curl_conc',
 'Spider Curl (Dumbbell)':'curl_incline', 'Preacher Curl (Machine)':'curl_preacher', 'Reverse Curl (Barbell)':'curl', 'Triceps Kickback (Dumbbell)':'kickback',
 'Close Grip Bench Press':'bench_bb', 'Squat (Barbell)':'squat_bb', 'Front Squat (Barbell)':'squat_front', 'Squat (Smith Machine)':'squat_bb', 'Hack Squat (Machine)':'squat_bb',
 'Pendulum Squat (Machine)':'squat_bb', 'Goblet Squat':'squat_goblet', 'Bodyweight Squat':'squat_bw', 'Sit to Stand':'sit_stand', 'Walking Lunge (Dumbbell)':'lunge',
 'Split Squat (Dumbbell)':'lunge', 'Lateral Lunge':'latlunge', 'Lateral Step Down':'stepdown', 'Box Jump':'box_jump', 'Squat Jump':'squat_jump', 'Nordic Hamstring Curl':'nordic',
 'Leg Press Calf Raise':'calf', 'Calf Raise (Bodyweight)':'calf', 'Single Leg Glute Bridge':'bridge_sl', 'Clamshell':'sidelying', 'Side Lying Leg Raise':'sidelying',
 'Hip Abduction (Cable)':'abduction', 'Crunch':'crunch', 'Hanging Leg Raise':'hangraise', 'Lying Leg Raise':'legraise', 'Russian Twist':'twist', 'Ab Wheel':'plank',
 'Pallof Press':'pallof', 'Bird Dog':'birddog', 'Mountain Climber':'mountain', 'Burpee':'burpee', 'Jumping Jack':'jack', 'Hollow Hold':'hollow', 'Copenhagen Plank':'plank',
 "Farmer's Walk":'carry', 'Dead Hang':'hangraise', 'Hip Flexor Stretch':'hipflexor', 'Couch Stretch':'hipflexor', 'Hamstring Stretch':'hamstring', '90/90 Hip Stretch':'hip9090',
 'Cat Cow':'catcow', "Child's Pose":'childpose', 'Thoracic Rotation':'tspine', 'Calf Stretch':'calfstretch', 'Doorway Pec Stretch':'pecstretch', 'Deep Squat Hold':'deepsquat'
};
/* Plantilla por patrón para ejercicios propios o sin plantilla */
const GPAT = {press_h:'bench_db', press_inc:'incline_db', fly:'fly_cable', press_v:'ohp', lat_raise:'latraise', rear:'rearfly', tri:'pushdown', pull_v:'pulldown', row:'row_cable',
  curl:'curl', hinge:'hinge_db', squat:'squat_goblet', knee_ext:'legext', leg_curl:'legcurl_seat', abd:'abduction', add:'adduction', calf:'calf', core:'crunch', hip:'hipthrust',
  iso:'wallsit', front_raise:'frontraise', upright:'uprightrow', shrug:'shrug', rot:'extrot', jump:'squat_jump', carry:'carry', mob:'catcow'};
const gtplFor = n => GMAP[n] || GPAT[(EX[n] || [])[6]] || null;

/* =====================================================================
   CÓMO SE HACE: pasos y errores por plantilla (y matices por ejercicio)
   ===================================================================== */
const GTXT = {
 squat_goblet:{how:['Pies a la anchura de hombros, puntas algo abiertas. Sujeta la mancuerna pegada al pecho.','Baja llevando la cadera atrás y abajo, como para sentarte, con el pecho alto.','Baja hasta donde mantengas la espalda neutra y la rodilla en verde; sube empujando el suelo.'], err:['Rodillas hacia dentro: empújalas hacia fuera, en la línea de los pies.','Talones que se levantan: reparte el peso en todo el pie.']},
 squat_bb:{how:['Barra apoyada en la parte alta de la espalda, no en el cuello. Pies a la anchura de hombros.','Coge aire, aprieta el abdomen y baja con la cadera atrás y las rodillas siguiendo a los pies.','Sube empujando con todo el pie y suelta el aire al final.'], err:['Redondear la espalda abajo: baja solo hasta donde la mantengas neutra.','Rodillas hacia dentro al subir.']},
 squat_front:{how:['Barra apoyada delante, sobre los hombros, codos altos.','Baja con el tronco más vertical que en la sentadilla trasera.','Sube manteniendo los codos arriba.'], err:['Dejar caer los codos: la barra se va hacia delante.','Inclinar el tronco en exceso.']},
 squat_box:{how:['Cajón o banco detrás a una altura cómoda. Mancuerna pegada al pecho.','Baja controlando hasta rozar el cajón con la cadera, sin dejarte caer.','Sube empujando el suelo. Cada 2-3 semanas puedes bajar la altura del cajón.'], err:['Sentarte y relajar el tronco.','Rebotar en el cajón.']},
 squat_bw:{how:['Pies a la anchura de hombros, brazos delante para equilibrarte.','Baja con la cadera atrás y el pecho alto.','Sube empujando el suelo.'], err:['Rodillas hacia dentro.','Levantar los talones.']},
 sit_stand:{how:['Siéntate en el borde de una silla firme, pies apoyados y algo por detrás de las rodillas.','Inclina el tronco hacia delante y levántate sin ayudarte de las manos si puedes.','Siéntate despacio, controlando la bajada (3 segundos).'], err:['Dejarse caer en la silla.','Usar las manos en los muslos para empujar (al principio vale, el objetivo es dejar de hacerlo).']},
 squat_jump:{how:['Baja a media sentadilla con los brazos atrás.','Salta lo más alto que puedas extendiendo cadera, rodillas y tobillos.','Aterriza suave, con las rodillas flexionadas y alineadas con los pies.'], err:['Aterrizar con las piernas rectas.','Rodillas hacia dentro al caer.']},
 box_jump:{how:['De pie frente al cajón, a medio paso.','Baja rápido a media sentadilla y salta al cajón.','Aterriza suave en el cajón y baja andando, no saltando.'], err:['Usar un cajón demasiado alto.','Saltar hacia abajo: es lo que más carga la rodilla.']},
 legpress:{how:['Espalda y cadera pegadas al respaldo. Pies en la parte media-alta de la plataforma.','Baja controlando 2-3 segundos hasta donde la rodilla siga en verde.','Empuja sin bloquear las rodillas arriba.'], err:['Despegar la cadera del asiento abajo.','Bloquear las rodillas de golpe al subir.']},
 hinge_bb:{how:['Barra pegada a los muslos, rodillas un poco flexionadas.','Lleva la cadera atrás deslizando la barra por las piernas, espalda neutra.','Baja hasta notar el estiramiento del femoral y sube apretando la cadera hacia delante.'], err:['Redondear la espalda para bajar más.','Separar la barra de las piernas.']},
 hinge_db:{how:['Mancuernas delante de los muslos, rodillas un poco flexionadas.','Lleva la cadera atrás con la espalda neutra.','Baja hasta notar el femoral y vuelve apretando la cadera.'], err:['Redondear la espalda.','Doblar demasiado las rodillas (se convierte en sentadilla).']},
 deadlift:{how:['Barra sobre la mitad del pie, espinillas cerca. Agarra justo fuera de las piernas.','Pecho alto, espalda neutra y brazos rectos. Empuja el suelo con las piernas.','Cuando la barra pase las rodillas, lleva la cadera adelante hasta quedarte de pie.'], err:['Tirar con la espalda redondeada.','Hiperextender la espalda arriba.']},
 goodmorning:{how:['Barra en la parte alta de la espalda, rodillas un poco flexionadas.','Inclínate llevando la cadera atrás con la espalda neutra.','Vuelve apretando glúteo y femoral.'], err:['Redondear la espalda.','Usar mucho peso: es un ejercicio de técnica.']},
 sl_rdl:{how:['De pie sobre una pierna, la otra un poco por detrás.','Inclínate llevando la pierna libre atrás en línea con el tronco.','Vuelve controlando, sin girar la cadera.'], err:['Abrir la cadera hacia un lado.','Doblar la espalda en vez de la cadera.']},
 kb_swing:{how:['Pies algo más anchos que la cadera, kettlebell delante.','Llévala entre las piernas con la cadera atrás (bisagra, no sentadilla).','Empuja la cadera adelante con fuerza: la kettlebell sube por inercia hasta la altura del pecho.'], err:['Subirla con los brazos.','Hacer una sentadilla en lugar de una bisagra.']},
 pull_through:{how:['De espaldas a una polea baja, cuerda entre las piernas.','Lleva la cadera atrás con la espalda neutra.','Vuelve apretando la cadera hacia delante.'], err:['Tirar con los brazos.','Redondear la espalda.']},
 hyperext:{how:['Cadera apoyada en el borde del almohadillado, pies sujetos.','Baja con la espalda neutra doblando la cadera.','Sube hasta quedar en línea con las piernas, sin pasarte.'], err:['Hiperextender la espalda arriba.','Hacerlo rápido y con rebote.']},
 lunge:{how:['Da un paso largo (hacia atrás en la zancada atrás).','Baja la rodilla de atrás hacia el suelo con el tronco recto.','Empuja con el talón de la pierna de delante para volver.'], err:['Rodilla de delante hacia dentro.','Paso demasiado corto: la rodilla de delante se va muy adelante.']},
 bulgarian:{how:['Pie de atrás apoyado en un banco, el de delante a un paso largo.','Baja vertical, con el tronco algo inclinado.','Sube empujando con la pierna de delante.'], err:['Apoyar el peso en la pierna de atrás.','Pie de delante demasiado cerca del banco.']},
 stepup:{how:['Un pie entero sobre un cajón bajo (rodilla a unos 90° o menos).','Sube empujando con la pierna de arriba, sin impulsarte con la de abajo.','Baja despacio.'], err:['Impulsarte con el pie del suelo.','Cajón demasiado alto para tu rodilla.']},
 stepdown:{how:['De pie de lado sobre un escalón bajo, apoyado en una pierna.','Baja despacio el talón de la otra pierna hasta rozar el suelo.','Vuelve arriba con la pierna del escalón; rodilla alineada con el pie.'], err:['Dejar que la rodilla se meta hacia dentro.','Bajar rápido.']},
 legext:{how:['Rodilla alineada con el eje de la máquina; rodillo encima del tobillo.','Extiende las piernas en 1 segundo.','Baja en 2-3 segundos. Con la rodilla sensible, trabaja el tramo de 90° a 45°.'], err:['Dar golpes arriba bloqueando la rodilla.','Despegar la cadera del asiento.']},
 legcurl_seat:{how:['Rodilla alineada con el eje; almohadilla de muslo bien ajustada.','Lleva los talones hacia abajo y atrás.','Vuelve despacio hasta casi estirar la pierna.'], err:['Levantar la cadera del asiento.','Soltar el peso de golpe al volver.']},
 legcurl_lie:{how:['Tumbado boca abajo, rodilla justo fuera del banco, rodillo sobre el tobillo.','Lleva los talones hacia los glúteos sin levantar la cadera.','Baja despacio.'], err:['Levantar la cadera.','Rebote abajo.']},
 nordic:{how:['De rodillas sobre algo blando, tobillos sujetos.','Déjate caer hacia delante muy despacio con el cuerpo recto, frenando con los femorales.','Pon las manos al llegar abajo y empuja para volver.'], err:['Doblar la cadera para frenar menos.','Caer de golpe: el beneficio está en frenar.']},
 calf:{how:['Puntas de los pies en el borde de un escalón.','Baja el talón hasta notar el estiramiento.','Sube lo más alto que puedas y aguanta 1 segundo arriba.'], err:['Rebotar abajo.','Recorrido corto.']},
 calf_seat:{how:['Sentado, almohadilla sobre las rodillas, puntas en la plataforma.','Baja los talones hasta notar el estiramiento.','Sube lo más alto posible y aguanta 1 segundo.'], err:['Rebotar.','Recorrido corto.']},
 wallsit:{how:['Espalda contra la pared, baja hasta que las rodillas estén entre 60° y 90°.','Rodillas encima de los tobillos, peso en los talones.','Aguanta el tiempo marcado respirando normal.'], err:['Bajar más de lo que tolera la rodilla.','Aguantar la respiración.']},
 tke:{how:['Banda detrás de la rodilla, atada delante a algo fijo.','Rodilla un poco flexionada.','Estira la rodilla del todo apretando el cuádriceps y aguanta 1 segundo.'], err:['Mover la cadera en lugar de la rodilla.','Hacerlo rápido.']},
 hipthrust:{how:['Parte alta de la espalda apoyada en el banco, barra sobre la cadera.','Barbilla hacia el pecho, sube la cadera hasta quedar en línea con rodillas y hombros.','Aprieta el glúteo 1 segundo arriba y baja controlando.'], err:['Arquear la zona lumbar arriba.','Pies demasiado lejos (trabaja más el femoral).']},
 bridge:{how:['Tumbado boca arriba, rodillas dobladas y pies apoyados.','Sube la cadera apretando el glúteo hasta quedar en línea con las rodillas.','Baja despacio.'], err:['Arquear la espalda.','Empujar con los pies de puntillas.']},
 bridge_sl:{how:['Como el puente, pero con una pierna estirada.','Sube la cadera con la pierna apoyada sin que la cadera se ladee.','Baja despacio.'], err:['Cadera torcida.','Arquear la espalda.']},
 bench_bb:{how:['Ojos debajo de la barra, escápulas juntas y hacia abajo, pies firmes en el suelo.','Baja la barra controlada hasta la parte baja del pecho, codos a unos 45°.','Empuja hacia arriba y un poco hacia atrás.'], err:['Codos abiertos a 90° (carga el hombro).','Rebotar la barra en el pecho.']},
 bench_db:{how:['Tumbado, escápulas juntas, mancuernas a la altura del pecho.','Baja hasta notar el estiramiento del pecho, codos a unos 45°.','Empuja hacia arriba juntando un poco las mancuernas.'], err:['Bajar sin control.','Arquear mucho la espalda.']},
 incline_db:{how:['Banco a 30-45°. Escápulas juntas y abajo.','Baja las mancuernas a la parte alta del pecho, codos a unos 45°.','Empuja hacia arriba sin chocar las mancuernas.'], err:['Banco demasiado inclinado (pasa a ser hombro).','Codos muy abiertos.']},
 incline_bb:{how:['Banco a 30-45°, barra a la altura de la parte alta del pecho.','Baja controlando hasta rozar el pecho.','Empuja vertical.'], err:['Despegar la cadera del banco.','Rebotar.']},
 press_mach:{how:['Ajusta el asiento para que las asas queden a la altura del pecho.','Espalda pegada al respaldo, empuja hacia delante.','Vuelve despacio hasta notar el estiramiento.'], err:['Despegar la espalda.','Recorrido corto.']},
 fly_mach:{how:['Asiento a la altura que deje los brazos paralelos al suelo.','Junta las asas delante del pecho con los codos un poco flexionados.','Abre despacio hasta notar el estiramiento.'], err:['Empujar con los brazos (se convierte en press).','Abrir más de lo que tolera el hombro.']},
 fly_cable:{how:['Poleas a la altura del pecho (o abajo para el cruce de abajo arriba).','Con los codos un poco flexionados, junta las manos delante.','Abre controlando.'], err:['Doblar mucho los codos.','Inclinarse demasiado.']},
 fly_db:{how:['Tumbado, mancuernas arriba con los codos un poco flexionados.','Abre los brazos en arco hasta notar el estiramiento.','Vuelve por el mismo arco.'], err:['Bajar demasiado.','Estirar del todo los codos.']},
 pushup:{how:['Manos algo más anchas que los hombros, cuerpo en línea recta.','Baja el pecho hacia el suelo con los codos a unos 45°.','Empuja hasta estirar los brazos sin que la cadera se hunda.'], err:['Cadera hundida o muy alta.','Codos abiertos a 90°.']},
 pushup_knee:{how:['Rodillas apoyadas, cuerpo en línea de rodillas a cabeza.','Baja el pecho hacia el suelo.','Empuja hasta estirar los brazos.'], err:['Doblar la cadera.','Bajar a medias.']},
 pushup_inc:{how:['Manos sobre un banco o mesa firme, cuerpo recto.','Baja el pecho hacia el borde.','Empuja hasta estirar los brazos.'], err:['Cadera hundida.','Apoyo inestable.']},
 dip:{how:['Agarra las paralelas con los brazos estirados.','Baja inclinando un poco el tronco hasta que los hombros queden algo por debajo de los codos.','Sube empujando.'], err:['Bajar más de lo que tolera el hombro.','Encoger los hombros.']},
 bench_dip:{how:['Manos en el borde de un banco detrás de ti, piernas delante.','Baja doblando los codos hacia atrás.','Sube empujando con los tríceps.'], err:['Bajar demasiado: carga mucho el hombro.','Abrir los codos.']},
 ohp:{how:['Sentado con respaldo, mancuernas a la altura de los hombros.','Empuja hacia arriba hasta casi estirar los brazos.','Baja controlando a la altura de las orejas.'], err:['Arquear la zona lumbar.','Bajar muy por debajo de la barbilla.']},
 ohp_bb:{how:['De pie, barra sobre la clavícula, glúteo y abdomen apretados.','Empuja vertical apartando la cabeza y métela debajo de la barra arriba.','Baja controlando.'], err:['Arquear la espalda.','Empujar la barra hacia delante.']},
 ohp_mach:{how:['Asiento con las asas a la altura de los hombros.','Empuja hacia arriba.','Baja despacio.'], err:['Despegar la espalda.','Recorrido corto.']},
 latraise:{how:['De pie, mancuernas a los lados, codos un poco flexionados.','Sube los brazos hacia los lados hasta la altura de los hombros.','Baja en 2 segundos.'], err:['Balancear el cuerpo.','Subir con los trapecios encogiendo los hombros.']},
 latraise_cable:{how:['Polea baja al lado contrario del brazo que trabaja.','Sube el brazo hacia el lado hasta la altura del hombro.','Baja despacio: la polea mantiene la tensión abajo.'], err:['Inclinar el tronco.','Doblar mucho el codo.']},
 frontraise:{how:['De pie, mancuernas delante de los muslos.','Sube un brazo (o los dos) por delante hasta la altura del hombro.','Baja despacio.'], err:['Balanceo.','Subir por encima de la cabeza.']},
 uprightrow:{how:['Agarre a la anchura de los hombros.','Sube la barra o la cuerda pegada al cuerpo con los codos por delante.','Para a la altura del pecho.'], err:['Subir por encima del pecho (pinza el hombro).','Agarre muy estrecho.']},
 shrug:{how:['De pie, peso a los lados.','Sube los hombros hacia las orejas.','Aguanta 1 segundo y baja despacio.'], err:['Girar los hombros.','Doblar los codos.']},
 rearfly:{how:['Inclinado hacia delante (o apoyado en un banco inclinado), brazos colgando.','Abre los brazos hacia los lados con los codos un poco flexionados.','Baja despacio.'], err:['Juntar las escápulas en exceso (se convierte en remo).','Balanceo.']},
 extrot:{how:['Polea a la altura del codo, codo pegado al costado a 90°.','Gira el antebrazo hacia fuera sin separar el codo.','Vuelve despacio.'], err:['Separar el codo del cuerpo.','Usar demasiado peso.']},
 facepull:{how:['Polea a la altura de la cara, cuerda agarrada con los pulgares hacia atrás.','Tira hacia la cara separando las manos y con los codos altos.','Vuelve despacio.'], err:['Codos bajos (se convierte en remo).','Echarse hacia atrás.']},
 landmine_press:{how:['Extremo de la barra a la altura del hombro, un pie algo adelantado.','Empuja hacia arriba y adelante.','Baja controlando.'], err:['Arquear la espalda.','Girar el tronco.']},
 row_cable:{how:['Sentado, pies en la plataforma y rodillas un poco flexionadas.','Tira del agarre hacia el ombligo llevando los codos atrás y juntando las escápulas.','Vuelve estirando los brazos y dejando que las escápulas se separen.'], err:['Balancear el tronco para tirar.','Encoger los hombros.']},
 row_mach:{how:['Pecho apoyado en el almohadillado.','Tira llevando los codos atrás y juntando las escápulas.','Vuelve despacio estirando del todo.'], err:['Separar el pecho del apoyo.','Recorrido corto.']},
 row_bb:{how:['Inclinado a unos 45°, espalda neutra, rodillas un poco flexionadas.','Tira de la barra hacia el ombligo.','Baja controlando.'], err:['Levantar el tronco para tirar.','Redondear la espalda.']},
 row_db:{how:['Mano y rodilla en el banco, espalda recta.','Tira de la mancuerna hacia la cadera.','Baja estirando del todo.'], err:['Girar el tronco.','Tirar hacia el hombro en vez de hacia la cadera.']},
 row_inc:{how:['Pecho apoyado en un banco a 30-45°, mancuernas colgando.','Tira llevando los codos atrás.','Baja estirando del todo.'], err:['Separar el pecho del banco.','Encoger los hombros.']},
 row_tbar:{how:['Inclinado sobre la barra, espalda neutra, rodillas un poco flexionadas.','Tira del agarre hacia el pecho.','Baja estirando los brazos.'], err:['Levantar el tronco para tirar.','Redondear la espalda.']},
 row_inv:{how:['Debajo de una barra a la altura de la cintura, cuerpo recto y talones en el suelo.','Tira del pecho hacia la barra.','Baja estirando los brazos.'], err:['Cadera hundida.','Recorrido corto.']},
 pulldown:{how:['Rodillas bajo el apoyo, agarre algo más ancho que los hombros.','Tira de la barra hacia la parte alta del pecho llevando los codos abajo.','Sube despacio hasta estirar los brazos.'], err:['Echarse muy atrás.','Tirar por detrás de la nuca.']},
 pullup:{how:['Cuelga de la barra con los brazos estirados.','Tira llevando el pecho hacia la barra y los codos hacia abajo.','Baja hasta estirar los brazos.'], err:['Medias repeticiones.','Balancearse.']},
 pullup_assist:{how:['Rodillas (o pies) en el apoyo de la máquina; más peso = más ayuda.','Tira hasta que la barbilla pase la barra.','Baja despacio hasta estirar los brazos.'], err:['Recorrido corto.','Dejar caer el cuerpo.']},
 straight_pd:{how:['De pie frente a la polea alta, ligeramente inclinado.','Con los brazos casi rectos, lleva la barra o la cuerda hasta los muslos.','Vuelve despacio.'], err:['Doblar los codos.','Mover el tronco.']},
 pullover:{how:['Tumbado en el banco, mancuerna sobre el pecho con los brazos casi rectos.','Llévala por detrás de la cabeza hasta notar el estiramiento.','Vuelve por el mismo arco.'], err:['Doblar mucho los codos.','Bajar más de lo que tolera el hombro.']},
 superman:{how:['Tumbado boca abajo, brazos estirados delante.','Levanta a la vez brazos, pecho y piernas unos centímetros.','Aguanta 1-2 segundos y baja.'], err:['Levantar demasiado (carga la zona lumbar).','Doblar el cuello hacia arriba.']},
 curl:{how:['De pie, codos pegados al cuerpo.','Sube el peso doblando el codo sin moverlo hacia delante.','Baja en 2-3 segundos.'], err:['Balancear el tronco.','Mover el codo.']},
 curl_cable:{how:['De pie frente a la polea baja.','Sube doblando los codos, pegados al cuerpo.','Baja despacio: la polea mantiene la tensión.'], err:['Mover los codos.','Balanceo.']},
 curl_preacher:{how:['Brazos apoyados en el banco Scott.','Sube el peso sin despegar los brazos del apoyo.','Baja despacio hasta casi estirar el codo.'], err:['Estirar de golpe abajo.','Levantar los codos.']},
 curl_incline:{how:['Banco a 45-60°, brazos colgando por detrás del cuerpo.','Sube sin adelantar los codos.','Baja hasta estirar del todo.'], err:['Adelantar los codos.','Usar demasiado peso.']},
 curl_conc:{how:['Sentado, codo apoyado en la cara interna del muslo.','Sube la mancuerna hacia el hombro.','Baja despacio.'], err:['Mover el codo.','Ayudarse con el tronco.']},
 pushdown:{how:['De pie frente a la polea alta, codos pegados al cuerpo.','Empuja hacia abajo hasta estirar los codos.','Sube despacio hasta que el antebrazo quede paralelo al suelo.'], err:['Separar los codos del cuerpo.','Echarse encima de la barra.']},
 ohext:{how:['Mancuerna sujeta con las dos manos por encima de la cabeza.','Bájala por detrás de la cabeza doblando los codos.','Sube hasta estirar.'], err:['Abrir mucho los codos.','Arquear la espalda.']},
 ohext_cable:{how:['De espaldas a la polea, cuerda por detrás de la cabeza, un pie adelantado.','Estira los codos hacia delante y arriba.','Vuelve despacio notando el estiramiento.'], err:['Mover los codos.','Arquear la espalda.']},
 skull:{how:['Tumbado, barra o mancuernas arriba con los brazos estirados.','Baja doblando solo los codos hacia la frente.','Sube estirando.'], err:['Abrir los codos.','Mover los hombros.']},
 kickback:{how:['Inclinado con apoyo, brazo pegado al costado y codo a 90°.','Estira el codo hacia atrás.','Vuelve despacio.'], err:['Mover el hombro.','Balancear el peso.']},
 crunch:{how:['Tumbado boca arriba, rodillas dobladas.','Enrolla el tronco despegando los hombros del suelo.','Baja despacio.'], err:['Tirar del cuello con las manos.','Subir con impulso.']},
 crunch_cable:{how:['De rodillas frente a la polea alta, cuerda junto a la cabeza.','Enrolla el tronco llevando los codos hacia las rodillas.','Vuelve despacio.'], err:['Mover la cadera en vez de enrollar.','Tirar con los brazos.']},
 crunch_mach:{how:['Sentado, agarra las asas.','Enrolla el tronco hacia delante.','Vuelve despacio.'], err:['Usar los brazos.','Recorrido corto.']},
 legraise:{how:['Tumbado boca arriba, zona lumbar pegada al suelo.','Sube las piernas rectas hasta la vertical.','Bájalas despacio sin que la espalda se despegue.'], err:['Arquear la zona lumbar.','Dejar caer las piernas.']},
 hangraise:{how:['Colgado de la barra, sin balanceo.','Sube las piernas (o las rodillas) hasta la cadera.','Baja despacio.'], err:['Balancearse.','Subir con impulso.']},
 plank:{how:['Antebrazos en el suelo, codos bajo los hombros.','Cuerpo en línea recta, aprieta abdomen y glúteo.','Aguanta respirando normal.'], err:['Cadera hundida.','Cadera muy alta.']},
 deadbug:{how:['Tumbado boca arriba, brazos arriba y rodillas a 90°.','Estira a la vez un brazo atrás y la pierna contraria sin despegar la zona lumbar.','Vuelve y cambia de lado.'], err:['Arquear la espalda.','Ir rápido.']},
 birddog:{how:['A cuatro patas, manos bajo los hombros y rodillas bajo la cadera.','Estira a la vez un brazo y la pierna contraria.','Aguanta 2 segundos y cambia.'], err:['Girar la cadera.','Arquear la espalda.']},
 hollow:{how:['Tumbado boca arriba, zona lumbar pegada al suelo.','Despega hombros y piernas, brazos estirados.','Aguanta respirando.'], err:['Despegar la zona lumbar.','Aguantar la respiración.']},
 twist:{how:['Sentado, tronco inclinado atrás y pies apoyados o en el aire.','Gira el tronco a un lado y al otro.','Mantén la espalda recta.'], err:['Mover solo los brazos.','Redondear la espalda.']},
 pallof:{how:['De lado a la polea a la altura del pecho, agarre junto al esternón.','Estira los brazos hacia delante sin dejar que el tronco gire.','Vuelve despacio.'], err:['Girar el tronco.','Inclinarse.']},
 mountain:{how:['En posición de flexión con los brazos estirados.','Lleva una rodilla hacia el pecho y cambia de pierna.','Cadera estable y abdomen apretado.'], err:['Cadera muy alta.','Hombros por detrás de las manos.']},
 carry:{how:['Una mancuerna pesada en cada mano.','Camina erguido con pasos cortos.','Hombros atrás y abdomen apretado.'], err:['Inclinarse hacia un lado.','Encoger los hombros.']},
 jack:{how:['De pie, brazos a los lados.','Salta abriendo piernas y subiendo los brazos.','Salta de vuelta a la posición inicial.'], err:['Aterrizar con las piernas rectas.','Encoger los hombros.']},
 burpee:{how:['De pie, baja a sentadilla y apoya las manos.','Lleva los pies atrás a posición de flexión.','Vuelve los pies a las manos y ponte de pie (o salta).'], err:['Cadera hundida en la plancha.','Aterrizar con las rodillas rectas.']},
 abduction:{how:['Sentado con la espalda apoyada, almohadillas por fuera de las rodillas.','Abre las piernas en 1 segundo.','Ciérralas despacio sin dejar que el peso choque.'], err:['Echarse hacia delante.','Rebotar.']},
 adduction:{how:['Sentado, almohadillas por dentro de las rodillas.','Cierra las piernas.','Ábrelas despacio hasta un estiramiento cómodo.'], err:['Abrir más de lo cómodo.','Rebotar.']},
 bandwalk:{how:['Banda por encima de las rodillas, media sentadilla.','Da pasos laterales cortos sin juntar los pies del todo.','Mantén la tensión de la banda todo el rato.'], err:['Rodillas hacia dentro.','Levantar el tronco.']},
 sidelying:{how:['Tumbado de lado, piernas una sobre otra.','Sube la pierna de arriba (en la almeja: abre la rodilla con los pies juntos).','Baja despacio sin girar la cadera hacia atrás.'], err:['Girar la cadera.','Usar impulso.']},
 latlunge:{how:['Pies bien separados.','Lleva el peso a una pierna doblando esa rodilla y con la otra recta.','Vuelve al centro empujando.'], err:['Rodilla hacia dentro.','Redondear la espalda.']},
 hipflexor:{how:['Una rodilla en el suelo (sobre algo blando), el otro pie delante.','Aprieta el glúteo de la pierna de atrás y lleva la cadera un poco adelante.','Aguanta respirando; puedes subir el brazo del mismo lado.'], err:['Arquear la zona lumbar.','Echar la rodilla de delante muy por delante del pie.']},
 hamstring:{how:['Sentado con las piernas estiradas.','Inclínate desde la cadera con la espalda recta.','Aguanta notando el estiramiento detrás del muslo.'], err:['Redondear la espalda para llegar más lejos.','Rebotar.']},
 hip9090:{how:['Sentado con las dos rodillas dobladas a 90°, una delante y otra al lado.','Inclina el tronco sobre la pierna de delante con la espalda recta.','Aguanta y cambia de lado.'], err:['Redondear la espalda.','Forzar la rodilla.']},
 catcow:{how:['A cuatro patas.','Redondea la espalda llevando la barbilla al pecho (gato).','Luego hunde la espalda mirando al frente (camello). Lento y con la respiración.'], err:['Hacerlo rápido.','Forzar el cuello.']},
 childpose:{how:['De rodillas, siéntate sobre los talones.','Lleva el tronco hacia delante con los brazos estirados.','Respira despacio y relaja la espalda.'], err:['Forzar las rodillas si molestan: pon un cojín.','Aguantar la respiración.']},
 tspine:{how:['A cuatro patas.','Lleva una mano detrás de la cabeza y gira el tronco abriendo el codo hacia el techo.','Vuelve y repite; luego cambia de lado.'], err:['Girar la cadera.','Ir rápido.']},
 calfstretch:{how:['Manos en la pared, una pierna atrás con el talón apoyado.','Inclínate hacia la pared con la pierna de atrás recta.','Aguanta y cambia.'], err:['Levantar el talón.','Girar el pie hacia fuera.']},
 pecstretch:{how:['Antebrazo apoyado en el marco de una puerta, codo a la altura del hombro.','Gira el cuerpo hacia el otro lado hasta notar el pecho.','Aguanta y cambia.'], err:['Subir el codo por encima del hombro.','Forzar si molesta el hombro.']},
 deepsquat:{how:['Pies a la anchura de hombros, puntas algo abiertas.','Baja todo lo que puedas con los talones en el suelo.','Aguanta con el pecho alto; agárrate a algo si lo necesitas.'], err:['Levantar los talones.','Redondear mucho la espalda.']},
 walk:{how:['Pasos naturales.','Brazos sueltos.','Respira cómodo.'], err:['—','—']}
};
/* Matices por ejercicio (se añaden a los pasos de la plantilla) */
const GCUE = {
 'Leg Extension (Machine)':'Con tu rodilla: céntrate en el tramo de 90° a 45° y no bloquees arriba.',
 'Leg Press (Machine)':'Con tu rodilla: baja solo hasta donde el semáforo siga en verde.',
 'Romanian Deadlift (Barbell)':'Con tu cadera: baja hasta donde la espalda siga recta, aunque sea por encima de la rodilla.',
 'Hip Abduction (Machine)':'Clave para tus rodillas: no la saltes.',
 'Seated Leg Curl (Machine)':'Sentado hace crecer más el femoral que tumbado.',
 'Overhead Triceps Extension (Cable)':'Tras nuca: el tríceps creció más que en polea alta.',
 'Lateral Raise (Machine)':'En máquina: ajusta el asiento para que el eje quede a la altura del hombro.',
 'Wall Sit':'Isométrico: buena forma de cargar el cuádriceps con poca molestia de rodilla.',
 'Spanish Squat':'Banda detrás de las rodillas atada a algo fijo; échate atrás con las tibias verticales.',
 'Chest Supported Reverse Fly (Dumbbell)':'Apoya el pecho en un banco inclinado y abre los brazos hacia los lados.',
 'Single Arm Lateral Raise (Cable)':'Polea baja al lado contrario del brazo que trabaja.',
 'Clamshell':'Almeja: rodillas dobladas y pies juntos; abre la rodilla de arriba como una concha.',
 'Copenhagen Plank':'Plancha lateral con la pierna de arriba apoyada en un banco: trabaja los aductores.',
 'Side Plank':'Plancha de lado sobre un antebrazo, cuerpo recto de pies a cabeza.',
 'Ab Wheel':'Rueda: desde de rodillas, rueda hacia delante con el abdomen apretado y vuelve sin arquear la espalda.',
 'Dead Hang':'Cuelga con los brazos estirados y los hombros activos: bueno para la espalda y el agarre.',
 'Couch Stretch':'Rodilla de atrás junto a la pared o al sofá, empeine apoyado en vertical.',
 'Thoracic Rotation':'Gira desde la parte alta de la espalda, no desde la cadera.',
 'Leg Press Calf Raise':'En la prensa: solo las puntas en el borde de la plataforma, rodillas estiradas.',
 'Trap Bar Deadlift':'La barra hexagonal permite el tronco más vertical: menos carga en la espalda.',
 'Meadows Row':'Remo con el extremo de una barra anclada, a una mano.',
 'Arnold Press (Dumbbell)':'Empieza con las palmas hacia ti y gíralas al subir.',
 'Reverse Grip Lat Pulldown (Cable)':'Agarre supino (palmas hacia ti) a la anchura de los hombros.',
 'Close Grip Bench Press':'Manos a la anchura de los hombros y codos pegados.',
 'Decline Bench Press (Barbell)':'Banco con la cabeza más baja que la cadera.',
 'Low Cable Fly Crossovers':'Poleas abajo: sube las manos en diagonal hasta juntarlas a la altura del pecho.',
 'Hammer Curl (Dumbbell)':'Agarre neutro (palmas mirándose).',
 'Reverse Curl (Barbell)':'Agarre prono (palmas hacia abajo).',
 'Spider Curl (Dumbbell)':'Pecho apoyado en un banco inclinado, brazos colgando por delante.',
 'Kettlebell Swing':'Potencia de cadera: útil para la explosividad.',
 'Box Jump':'Ejercicio explosivo: pocas repeticiones y siempre fresco. Solo con la rodilla en verde.',
 'Squat Jump':'Explosivo: pocas repeticiones y aterrizaje suave. Solo con la rodilla en verde.',
 'Nordic Hamstring Curl':'Reduce las roturas de femoral en deportistas; empieza con pocas repeticiones.'
};
function gguide(n){
  const tpl = gtplFor(n), m = meta(n), t = GTXT[tpl] || {how:['Haz el movimiento controlado, sin impulso.','Baja en 2-3 segundos.','Deja 1-2 repeticiones en reserva.'], err:['Usar impulso.','Recortar el recorrido.']};
  return {tpl, how:t.how, err:t.err, cue:GCUE[n] || ''};
}
