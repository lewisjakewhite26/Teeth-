import './style.css';
import { preloadSkull, mountSkull } from './skull.js';

// Photos live in src/img. They play in filename order: 01-..., 02-..., 03-...
const files = import.meta.glob('./img/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const slides = Object.keys(files).sort().map((k) => ({ type: 'photo', src: files[k] }));
// last slide: the 3D skull. Only added if this computer can draw 3D, so an old board just ends on the human photo.
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}
if (hasWebGL()) {
  slides.push({ type: 'skull' });
  setTimeout(() => preloadSkull().catch(() => {}), 1500);
}

const stage = document.getElementById('stage');
let index = -1;

function show(i, first = false) {
  if (i < 0 || i >= slides.length || i === index) return;
  const d = first ? 3.2 : 2.0;

  // fade everything currently showing out...
  stage.querySelectorAll('.layer:not(.out)').forEach((old) => {
    old.style.setProperty('--d', d + 's');
    old.classList.remove('in');
    old.classList.add('out');
    setTimeout(() => { old._destroy?.(); old.remove(); }, d * 1000 + 100);
  });

  // ...while the new photo fades in on top
  const layer = document.createElement('div');
  layer.className = 'layer in';
  layer.style.setProperty('--d', d + 's');
  if (slides[i].type === 'skull') {
    layer.classList.add('skulllayer');
    stage.appendChild(layer);
    layer._destroy = mountSkull(layer).destroy;
  } else {
    const kb = document.createElement('div');
    kb.className = 'kb';
    const img = document.createElement('img');
    img.src = slides[i].src;
    img.draggable = false;
    kb.appendChild(img);
    layer.appendChild(kb);
    stage.appendChild(layer);
  }

  index = i;
  if (!first) swell();
}

// ---- quiet low sound under each change (M to mute) ----
let ctx = null;
let muted = false;
function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state !== 'running') ctx.resume();
}
function swell() {
  if (!ctx || muted || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  const tone = (type, f1, f2, peak, dur, delay = 0) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t + delay);
    o.frequency.exponentialRampToValueAtTime(f2, t + delay + dur);
    g.gain.setValueAtTime(0.0001, t + delay);
    g.gain.exponentialRampToValueAtTime(peak, t + delay + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    o.connect(g); g.connect(master);
    o.start(t + delay); o.stop(t + delay + dur + 0.1);
  };
  tone('sine', 42, 58, 0.35, 2.4);          // low swell
  tone('sine', 110, 38, 0.4, 0.45);         // soft thump as it starts
  tone('triangle', 82, 123, 0.05, 2.2);     // faint tension above it
}

// ---- controls: click, space or right arrow = next. left arrow = back ----
function next() { unlock(); show(index + 1); }
function prev() { unlock(); show(index - 1); }
window.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType !== 'touch') return;
  if (slides[index] && slides[index].type === 'skull') {
    // on the skull, dragging turns it. Tap the far left or right edge to change slide.
    const x = e.clientX / window.innerWidth;
    if (x > 0.93) next(); else if (x < 0.07) prev();
    return;
  }
  next();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  else if (e.key === 'm' || e.key === 'M') muted = !muted;
  else if (e.key === 'f' || e.key === 'F') toggleFull();
});
window.addEventListener('contextmenu', (e) => { e.preventDefault(); prev(); });
window.addEventListener('dblclick', () => { if (!(slides[index] && slides[index].type === 'skull')) toggleFull(); });
function toggleFull() {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { /* ignore */ }
}

// hide the cursor when it is still
let idle;
const wake = () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), 1800); };
window.addEventListener('pointermove', wake);
wake();

// start: black, then the first photo comes up out of the dark
setTimeout(() => show(0, true), 600);
