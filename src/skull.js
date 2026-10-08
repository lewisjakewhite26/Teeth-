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
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);

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

  const pivot = new THREE.Group();
  scene.add(pivot);

  let alive = true;
  let dist = 1;
  let zoom = 1;
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0;
  let lastTouch = -1e9;
  let frame = 0;

  preloadSkull().then((src) => {
    if (!alive) return;
    const model = src.clone(true);
    const male = model; // the file has been trimmed to the male skull only
    const box = new THREE.Box3().setFromObject(male);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    male.position.sub(centre);
    pivot.add(male);
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

  // ---- touch / mouse: drag to turn, wheel or pinch to zoom ----
  const pts = new Map();
  let pinch = 0;
  const down = (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastTouch = performance.now();
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
  };
  const move = (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    lastTouch = performance.now();
    if (pts.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoom = THREE.MathUtils.clamp(zoom * (d / pinch), 0.45, 1.4);
      pinch = d;
      return;
    }
    tYaw += (e.clientX - p.x) * 0.0085;
    tPitch = THREE.MathUtils.clamp(tPitch + (e.clientY - p.y) * 0.006, -0.55, 0.55);
    p.x = e.clientX; p.y = e.clientY;
  };
  const up = (e) => { pts.delete(e.pointerId); pinch = 0; lastTouch = performance.now(); };
  const wheel = (e) => {
    e.preventDefault();
    zoom = THREE.MathUtils.clamp(zoom * (e.deltaY > 0 ? 1.06 : 0.94), 0.45, 1.4);
    lastTouch = performance.now();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', wheel, { passive: false });

  const t0 = performance.now();
  function tick() {
    if (!alive) return;
    frame = requestAnimationFrame(tick);
    const now = performance.now();
    const idle = now - lastTouch > 3500;
    // when nobody is touching it, it drifts slowly left and right, face to the class
    const sway = idle ? Math.sin((now - t0) / 1000 * 0.38) * 0.5 : 0;
    const goalYaw = idle ? sway : tYaw;
    if (idle) tYaw = yaw;
    yaw += (goalYaw - yaw) * 0.06;
    pitch += ((idle ? 0.04 : tPitch) - pitch) * 0.06;
    if (idle) tPitch = pitch;
    pivot.rotation.set(pitch, yaw, 0);
    const d = dist * zoom;
    camera.position.set(0, 0, d);
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
