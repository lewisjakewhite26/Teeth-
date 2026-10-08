import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import modelUrl from './model/skull.glb?url';

// The skull loads quietly in the background so it is ready when we get to it.
let loading = null;
export function preloadSkull() {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      new GLTFLoader().load(modelUrl, (g) => resolve(g.scene), undefined, reject);
    });
  }
  return loading;
}

// Builds the interactive skull inside `host`. Returns { destroy }.
export function mountSkull(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'skull';
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.004, 20);

  // Lit like the photos: one warm key light, a cool edge light from behind, very little fill.
  scene.add(new THREE.HemisphereLight(0x8a93a6, 0x151210, 0.55));
  const key = new THREE.DirectionalLight(0xffe6c4, 2.6);
  key.position.set(-1.2, 1.4, 2.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db8ff, 2.2);
  rim.position.set(1.8, 0.6, -1.6);
  scene.add(rim);
  const under = new THREE.DirectionalLight(0xfff0dc, 0.7);
  under.position.set(0.3, -1.2, 1.8);
  scene.add(under);

  const pivot = new THREE.Group();   // turns and pans
  scene.add(pivot);
  const holder = new THREE.Group();  // shifted so the chosen point sits at the centre of the turn
  pivot.add(holder);
  let skullMesh = null;
  const focus = new THREE.Vector3(), tFocus = new THREE.Vector3();
  let panX = 0, panY = 0, tPanX = 0, tPanY = 0, tZoom = 1;

  let alive = true;
  let dist = 1;
  let zoom = 1;
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0;
  let lastTouch = -1e9;
  let frame = 0;
  let lastFrame = performance.now();

  preloadSkull().then((src) => {
    if (!alive) return;
    const model = src.clone(true);
    const male = model; // the file has been trimmed to the male skull only
    const box = new THREE.Box3().setFromObject(male);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    male.position.sub(centre);
    holder.add(male);
    skullMesh = male;
    const h = Math.max(size.y, size.x * 0.8);
    dist = (h / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.02;
    resize();
  });

  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- touch / mouse ----
  // one finger: turn.  two fingers: pinch to zoom and slide to move it.
  // tap a tooth (or anywhere on the skull): fly in and centre it.  tap the black: back to the whole skull.
  // mouse: left drag turns, right drag or shift-drag moves, wheel zooms.
  const MINZ = 0.07, MAXZ = 1.4;
  const clampZ = (z) => THREE.MathUtils.clamp(z, MINZ, MAXZ);
  const pts = new Map();
  let pinch = 0, mid = null, gesture = null;
  const midpoint = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  const down = (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastTouch = performance.now();
    if (pts.size === 1) {
      gesture = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, multi: false, pan: e.button === 2 || e.shiftKey || e.button === 1 };
    } else if (pts.size === 2) {
      gesture.multi = true;
      const [a, b] = [...pts.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
      mid = midpoint();
    }
  };
  const move = (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    lastTouch = performance.now();
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    gesture.moved += Math.abs(dx) + Math.abs(dy);
    const perPx = (2 * dist * zoom * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / (host.clientHeight || 1);
    if (pts.size >= 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) { zoom = clampZ(zoom * (pinch / d)); tZoom = zoom; }
      pinch = d;
      const m = midpoint();
      if (mid) { tPanX += (m.x - mid.x) * perPx; tPanY -= (m.y - mid.y) * perPx; panX = tPanX; panY = tPanY; }
      mid = m;
      return;
    }
    if (gesture.pan) {
      tPanX += dx * perPx; tPanY -= dy * perPx; panX = tPanX; panY = tPanY;
    } else {
      tYaw += dx * 0.0085;
      tPitch = THREE.MathUtils.clamp(tPitch + dy * 0.006, -0.7, 0.7);
    }
    p.x = e.clientX; p.y = e.clientY;
  };
  const up = (e) => {
    const was = pts.size;
    pts.delete(e.pointerId);
    pinch = 0; mid = null;
    lastTouch = performance.now();
    if (was === 1 && gesture && !gesture.multi && gesture.moved < 14 && performance.now() - gesture.t < 450 && !gesture.pan) tap(e);
  };

  function tap(e) {
    if (!skullMesh) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    camera.updateMatrixWorld();
    skullMesh.updateMatrixWorld(true);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(skullMesh, true)[0];
    if (hit) {
      tFocus.copy(holder.worldToLocal(hit.point.clone()));
      tPanX = 0; tPanY = 0;
      tZoom = Math.min(zoom, 0.22);           // close enough to fill the board with a tooth
    } else {
      resetView();
    }
  }
  function resetView() {
    tFocus.set(0, 0, 0); tZoom = 1; tPanX = 0; tPanY = 0; tYaw = 0; tPitch = 0;
    lastTouch = performance.now() - 3000;   // sway starts again shortly
  }
  const wheel = (e) => {
    e.preventDefault();
    tZoom = clampZ(tZoom * (e.deltaY > 0 ? 1.1 : 0.9));
    lastTouch = performance.now();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); });
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

  const t0 = performance.now();
  function tick() {
    if (!alive) return;
    frame = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.25, (now - lastFrame) / 1000); lastFrame = now;
    const f = (k) => 1 - Math.exp(-k * dt);   // smoothing that does not depend on frame rate
    const idle = now - lastTouch > 3500 && tZoom > 0.85 && pts.size === 0;
    // when nobody is touching it, it drifts slowly left and right, face to the class
    const sway = idle ? Math.sin((now - t0) / 1000 * 0.38) * 0.5 : 0;
    const goalYaw = idle ? sway : tYaw;
    if (idle) tYaw = yaw;
    yaw += (goalYaw - yaw) * f(3.5);
    pitch += ((idle ? 0.04 : tPitch) - pitch) * f(3.5);
    if (idle) tPitch = pitch;
    // glide to the tooth that was tapped
    focus.lerp(tFocus, f(5));
    zoom += (tZoom - zoom) * f(4.5);
    if (pts.size < 2) { panX += (tPanX - panX) * f(7); panY += (tPanY - panY) * f(7); }
    holder.position.copy(focus).multiplyScalar(-1);
    pivot.position.set(panX, panY, 0);
    pivot.rotation.set(pitch, yaw, 0);
    camera.position.set(0, 0, dist * zoom);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  tick();

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    },
  };
}
