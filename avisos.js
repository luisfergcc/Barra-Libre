/* =====================================================================
   BARRA LIBRE · aviso de fin de descanso con la app en segundo plano (1.8.0)
   Un iPhone congela el JavaScript de una web cuando sales de ella, así que un temporizador normal no puede sonar.
   Lo que sí sigue funcionando con la pantalla bloqueada es el AUDIO: durante el descanso se reproduce un archivo de sonido
   generado aquí mismo, silencioso, con los pitidos (3-2-1 y el final) ya puestos en su sitio. Lo reproduce el sistema,
   no el JavaScript, así que suena a su hora aunque la app esté en segundo plano.
   Además, si lo activas, se envía una notificación (necesita la app instalada en la pantalla de inicio, iOS 16.4 o superior).
   No hay forma de avisar si cierras la app del todo (deslizarla hacia arriba en el selector de apps).
   ===================================================================== */
const RA = {el:null, url:null, on:false};
const restAudioOn = () => kv('restAudio', true);
const restNotifOn = () => kv('restNotif', false) && 'Notification' in window && Notification.permission === 'granted';

/* WAV mono de 8 bits y 8 kHz: ligero (≈ 8 KB por segundo de descanso) y suficiente para tonos de 660-1319 Hz */
function restWav(secs){
  const sr = 8000, tail = 2, n = Math.round((secs + tail) * sr), buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, 'data'); dv.setUint32(40, n, true);
  for (let i = 0; i < n; i++) buf[44 + i] = 128 + (i & 1);              // silencio con 1 bit de ruido, para que el sistema no lo trate como "nada"
  const tone = (at, f, d, amp) => { const s0 = Math.round(at * sr), len = Math.round(d * sr);
    for (let i = 0; i < len && s0 + i < n; i++) { const t = i / sr, env = Math.min(1, t / .01, (d - t) / .04);
      buf[44 + s0 + i] = Math.max(0, Math.min(255, Math.round(128 + 127 * amp * env * Math.sin(2 * Math.PI * f * t)))); } };
  for (const k of [3, 2, 1]) if (secs - k > 0) tone(secs - k, 660, .08, .5);
  tone(secs, 988, .2, .9); tone(secs + .22, 1319, .35, .9);
  return new Blob([buf], {type:'audio/wav'});
}
/* Se llama al empezar el descanso y cada vez que se suman o restan 15 s */
function alertStart(){
  if (!restT) return;
  const left = Math.max(1, Math.round((restT.end - Date.now()) / 1000));
  if (restAudioOn() && left <= 900) {
    try {
      if (!RA.el) { RA.el = new Audio(); RA.el.setAttribute('playsinline', ''); RA.el.preload = 'auto'; }
      if (RA.url) URL.revokeObjectURL(RA.url);
      RA.url = URL.createObjectURL(restWav(left));
      RA.el.src = RA.url; RA.el.currentTime = 0; RA.el.volume = 1;
      const p = RA.el.play(); RA.on = true;
      if (p && p.catch) p.catch(() => { RA.on = false; });
      if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({title:'Descanso entre series', artist:'Barra Libre'}); }
    } catch (e) { RA.on = false; }
  }
  swSend({t:'rest', end:restT.end});
}
function alertStop(){
  try { if (RA.el) { RA.el.pause(); RA.el.removeAttribute('src'); RA.el.load(); } } catch (e) {}
  RA.on = false; swSend({t:'cancel'});
  navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r => r && r.getNotifications({tag:'rest'}).then(l => l.forEach(n => n.close()))).catch(() => {});
}
/* El audio ya hace los pitidos: la app no repite los suyos cuando está sonando el archivo */
const alertAudioPlaying = () => RA.on && RA.el && !RA.el.paused;
/* Al llegar a cero: si no estás mirando la app, notificación */
async function alertEnd(){
  if (!restNotifOn() || document.visibilityState === 'visible') return;
  try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.showNotification('Descanso terminado', {body:'¡A por la serie!', tag:'rest', renotify:true, icon:'icon-180.png', vibrate:[200, 100, 200]}); } catch (e) {}
}
function swSend(msg){
  try { if (msg.t === 'rest' && !restNotifOn()) return;
    navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r => r && r.active && r.active.postMessage(msg)); } catch (e) {}
}
/* Al volver a la app con el descanso ya acabado, se limpia la notificación */
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') {
  navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r => r && r.getNotifications({tag:'rest'}).then(l => l.forEach(n => n.close()))).catch(() => {});
  if (restT) drawRest(); } });

function renderRestAlert(){
  const canN = 'Notification' in window, perm = canN ? Notification.permission : 'denied';
  return `<section class="card pad stack" style="gap:10px">
    <h2>Aviso de fin de descanso</h2>
    <p class="muted" style="margin:0;font-size:14px">Para que suene aunque bloquees el móvil o estés en otra app. Funciona si abres Barra Libre desde el icono de la pantalla de inicio.</p>
    <label class="row" style="gap:8px;font-size:14px;align-items:flex-start"><input type="checkbox" data-restaudio ${restAudioOn() ? 'checked' : ''}> <span>Sonido con la pantalla bloqueada o en otra app <span class="faint">· pitidos 3-2-1 y final; usa el volumen del móvil</span></span></label>
    <label class="row" style="gap:8px;font-size:14px;align-items:flex-start"><input type="checkbox" data-restnotif ${restNotifOn() ? 'checked' : ''} ${canN ? '' : 'disabled'}> <span>Notificación al terminar ${canN ? (perm === 'denied' ? '<span class="faint">· bloqueadas en los ajustes del móvil</span>' : '') : '<span class="faint">· este navegador no las permite</span>'}</span></label>
    <button class="btn" data-resttest>Probar ahora (10 s): bloquea el móvil</button>
    <p class="faint" style="font-size:12px;margin:0">Límite de iOS: si cierras la app del todo (la deslizas hacia arriba en el selector de apps), no puede avisar. Déjala abierta o en segundo plano. Mientras dura el descanso puede aparecer un reproductor en la pantalla de bloqueo.</p>
  </section>`;
}
document.addEventListener('change', async e => {
  const el = e.target; if (!el.matches) return;
  if (el.matches('[data-restaudio]')) { await setKv('restAudio', el.checked); toast(el.checked ? 'Sonará con la pantalla bloqueada' : 'Solo sonará con la app abierta'); }
  if (el.matches('[data-restnotif]')) {
    if (!el.checked) { await setKv('restNotif', false); toast('Notificaciones desactivadas'); return; }
    let p = 'denied'; try { p = await Notification.requestPermission(); } catch (er) {}
    await setKv('restNotif', p === 'granted'); el.checked = p === 'granted';
    toast(p === 'granted' ? 'Notificaciones activadas' : 'No se concedió el permiso. Actívalo en Ajustes del móvil → Barra Libre → Notificaciones.');
  }
});
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-resttest]')) { startRest(10); toast('Bloquea el móvil ahora: sonará en 10 s'); } });
