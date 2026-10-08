import './style.css';
import { preloadSkull, mountSkull } from './skull.js';
import { PHOTO, STAGES } from './teeth-map.js';

// Photos live in src/img. They play in filename order: 01-..., 02-..., 03-...
const files = import.meta.glob('./img/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const slides = Object.keys(files).sort().map((k) => ({ type: 'photo', src: files[k], stages: /human/i.test(k) ? STAGES : null }));
// first slide: the question
slides.unshift({ type: 'title', text: 'What do these teeth belong to?' });

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
let lit = 0; // how many tooth types are lit on the human photo

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
  if (slides[i].type === 'title') {
    const t = document.createElement('div');
    t.className = 'titletext';
    t.textContent = slides[i].text;
    layer.appendChild(t);
    stage.appendChild(layer);
  } else if (slides[i].type === 'skull') {
    layer.classList.add('skulllayer');
    stage.appendChild(layer);
    layer._destroy = mountSkull(layer).destroy;
  } else {
    const kb = document.createElement('div');
    kb.className = 'kb';
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const img = document.createElement('img');
    img.src = slides[i].src;
    img.draggable = false;
    wrap.appendChild(img);
    if (slides[i].stages) {
      wrap.insertAdjacentHTML('beforeend', buildGlow());
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.innerHTML = '<div class="capname"></div><div class="capjob"></div>';
      layer.appendChild(cap);
    }
    kb.appendChild(wrap);
    layer.appendChild(kb);
    stage.appendChild(layer);
  }

  index = i;
  lit = 0;
  if (!first) swell();
}

// ---- the glow on the human teeth: each click lights one type ----
function buildGlow() {
  const g = STAGES.map((st, n) => {
    const shapes = st.teeth.map(([x, y, rx, ry, r]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})"/>`).join('');
    return `<g class="glow" data-n="${n}" style="--c:${st.colour}">` +
      `<g class="tint" filter="url(#soft)">${shapes}</g><g class="halo" filter="url(#bloom)">${shapes}</g></g>`;
  }).join('');
  return `<svg class="glowsvg" viewBox="0 0 ${PHOTO.w} ${PHOTO.h}" preserveAspectRatio="xMidYMid meet">` +
    `<defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>` +
    `<filter id="bloom" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="26"/></filter></defs>${g}</svg>`;
}
function setStage(n) {
  lit = n;
  const layer = glowLayer();
  if (!layer) return;
  layer.querySelectorAll('.glow').forEach((el) => {
    const k = +el.dataset.n;
    el.classList.toggle('on', k === n - 1);
    el.classList.toggle('dim', k < n - 1);
  });
  const name = layer.querySelector('.capname');
  const job = layer.querySelector('.capjob');
  const cap = layer.querySelector('.cap');
  cap.classList.remove('show');
  setTimeout(() => {
    if (n > 0) {
      const st = STAGES[n - 1];
      name.textContent = st.name;
      name.style.color = st.colour;
      job.textContent = st.job;
      cap.classList.add('show');
    }
  }, n > 0 ? 350 : 0);
  if (n > 0) ping(n);
}
function glowLayer() {
  const l = [...stage.querySelectorAll('.layer:not(.out)')].pop();
  return l && l.querySelector('.glow') ? l : null;
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

function ping(n) {
  if (!ctx || muted || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = 220 * Math.pow(1.25, n);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 1.5);
}

// ---- controls: click, space or right arrow = next. left arrow = back ----
// on the human photo, each click first lights the next type of tooth, then moves on
function next() {
  unlock();
  const s = slides[index];
  if (s && s.stages && lit < s.stages.length) { setStage(lit + 1); return; }
  show(index + 1);
}
function prev() {
  unlock();
  const s = slides[index];
  if (s && s.stages && lit > 0) { setStage(lit - 1); return; }
  show(index - 1);
}
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
