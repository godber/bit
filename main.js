import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js';

let scene, camera, renderer;
let bit;
let idleGeom, cubeGeom, spikyGeom;
let material; // we’ll just swap the color for each state
let state = 'idle'; // 'idle' | 'yes' | 'no'
let t0 = performance.now();

// Colors to match your spec
const COLORS = {
  idle: 0x1ec8ff,   // blue/cyan
  yes:  0xffd400,   // yellow
  no:   0xff6a00    // orange
};

init();
animate();

/* ---------- Setup ---------- */
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 100);
  camera.position.set(0, 0, 4.2);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Geometries
  idleGeom = new THREE.IcosahedronGeometry(0.9, 0);          // clean icosahedron
  cubeGeom = new THREE.BoxGeometry(1.1, 1.1, 1.1);            // YES cube (a touch bigger)
  spikyGeom = makeSpikyGeometry(new THREE.IcosahedronGeometry(0.75, 2), {
    minAmp: 0.25, maxAmp: 0.55, seed: 1337
  });

  // Wireframe look (TRON vibes)
  material = new THREE.MeshBasicMaterial({
    color: COLORS.idle,
    wireframe: true
  });

  bit = new THREE.Mesh(idleGeom, material);
  scene.add(bit);

  // Hovering light tint (subtle)
  const amb = new THREE.AmbientLight(0x2288ff, 0.25);
  scene.add(amb);

  // Resize
  window.addEventListener('resize', onResize);

  // Buttons: press-and-hold behavior (mouse + touch)
  const btnYes = document.getElementById('btnYes');
  const btnNo  = document.getElementById('btnNo');

  pressHold(btnYes, () => setState('yes'), () => setState('idle'));
  pressHold(btnNo,  () => setState('no'),  () => setState('idle'));

  // Fallback: if window loses focus while pressed, revert to idle
  window.addEventListener('blur', () => setState('idle'));
}

/* ---------- Press & hold helpers ---------- */
function pressHold(el, onDown, onUp) {
  const down = (e) => { e.preventDefault(); el.setAttribute('aria-pressed', 'true'); onDown(); };
  const up   = (e) => { e.preventDefault(); el.setAttribute('aria-pressed', 'false'); onUp(); };

  el.addEventListener('mousedown', down);
  window.addEventListener('mouseup', up);

  el.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('touchend', up, { passive: false });
  window.addEventListener('touchcancel', up, { passive: false });
}

/* ---------- State switching ---------- */
function setState(next) {
  if (state === next) return;
  state = next;

  switch (state) {
    case 'yes':
      swapGeometry(cubeGeom);
      material.color.setHex(COLORS.yes);
      break;
    case 'no':
      swapGeometry(spikyGeom);
      material.color.setHex(COLORS.no);
      break;
    default:
      swapGeometry(idleGeom);
      material.color.setHex(COLORS.idle);
      break;
  }
}

function swapGeometry(newGeom) {
  if (bit.geometry !== newGeom) {
    bit.geometry.dispose?.(); // dispose old if it’s not one of our cached ones
    bit.geometry = newGeom;
  }
}

/* ---------- Spiky geometry generator ---------- */
function makeSpikyGeometry(baseGeom, { minAmp = 0.2, maxAmp = 0.5, seed = 42 } = {}) {
  // Convert to non-indexed so vertices are independent (gives spikes per face/vertex)
  const geom = baseGeom.toNonIndexed();
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  const rand = mulberry32(seed);
  const amps = [];
  for (let i = 0; i < pos.count; i++) {
    // Fixed pseudo-random amplitude per vertex
    const a = minAmp + (maxAmp - minAmp) * rand();
    amps.push(a);
  }

  // Displace each vertex along its normal from the origin
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length() || 1.0;
    v.normalize();
    const amp = amps[i];
    v.multiplyScalar(len + amp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  return geom;
}

// Small fast PRNG
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/* ---------- Frame loop ---------- */
function animate() {
  requestAnimationFrame(animate);

  const t = (performance.now() - t0) * 0.001;

  // Gentle idle hover & oscillation always on (more pronounced in idle)
  const hover = Math.sin(t * 1.7) * 0.18;
  bit.position.y = hover;

  // Rotation (slightly different per state)
  const rotX = state === 'idle' ? 0.012 : state === 'yes' ? 0.02 : 0.018;
  const rotY = state === 'idle' ? 0.017 : state === 'yes' ? 0.025 : 0.022;
  bit.rotation.x += rotX;
  bit.rotation.y += rotY;

  // Idle “breathing” scale for the icosahedron
  if (state === 'idle') {
    const s = 1 + Math.sin(t * 2.25) * 0.06;
    bit.scale.setScalar(s);
  } else {
    bit.scale.setScalar(1);
  }

  renderer.render(scene, camera);
}

/* ---------- Resize ---------- */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
