import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js';

let scene, camera, renderer;
let groups = {};         // { idle, yes, no }
let currentState = 'idle';
let targetState  = 'idle';
let transitionT  = 1;    // 0..1 progress of crossfade
let lastTime = performance.now();

// Transition tuning
const TRANSITION_TIME = 300; // ms
const COLORS = {
  idle: 0x1ec8ff,
  yes:  0xffd400,
  no:   0xff6a00
};

init();
animate();

/* ---------------- Setup ---------------- */
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 100);
  camera.position.set(0, 0, 4.2);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Build state groups (each = nested/pulsing inner+outer)
  groups.idle = makeNestedGroup(
    new THREE.IcosahedronGeometry(0.9, 0),
    COLORS.idle
  );
  groups.yes  = makeNestedGroup(
    new THREE.BoxGeometry(1.05, 1.05, 1.05),
    COLORS.yes
  );
  groups.no   = makeNestedGroup(
    makeSpikyGeometry(new THREE.IcosahedronGeometry(0.7, 2), { minAmp: 0.22, maxAmp: 0.5, seed: 7331 }),
    COLORS.no
  );

  // Start with only idle visible
  groups.idle.visible = true;
  groups.yes.visible  = false;
  groups.no.visible   = false;

  scene.add(groups.idle, groups.yes, groups.no);

  // Ambient hint
  scene.add(new THREE.AmbientLight(0x2266ff, 0.25));

  // Buttons: press & hold with mouse and touch
  const btnYes = document.getElementById('btnYes');
  const btnNo  = document.getElementById('btnNo');
  pressHold(btnYes, () => setTarget('yes'), () => setTarget('idle'));
  pressHold(btnNo,  () => setTarget('no'),  () => setTarget('idle'));

  // If window focus lost during hold, revert to idle
  window.addEventListener('blur', () => setTarget('idle'));

  window.addEventListener('resize', onResize);
}

/* ---------------- Nested pulsing group ---------------- */
function makeNestedGroup(baseGeom, colorHex) {
  // Two wireframe meshes with different base scales + opacity; they pulse with phase offset
  const group = new THREE.Group();

  const matOuter = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.9 });
  const matInner = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.65 });

  const outer = new THREE.Mesh(baseGeom, matOuter);
  const inner = new THREE.Mesh(baseGeom.clone ? baseGeom.clone() : baseGeom, matInner);

  // Slight base size difference so they’re visibly nested
  outer.scale.setScalar(1.00);
  inner.scale.setScalar(0.75);

  // Subtle separation to avoid perfect overlap shimmer
  outer.renderOrder = 1;
  inner.renderOrder = 0;

  group.userData = { inner, outer };
  group.add(outer, inner);
  return group;
}

/* ---------------- Press & hold helpers ---------------- */
function pressHold(el, onDown, onUp) {
  const down = (e) => { e.preventDefault(); el.setAttribute('aria-pressed', 'true'); onDown(); };
  const up   = (e) => { e.preventDefault(); el.setAttribute('aria-pressed', 'false'); onUp(); };

  el.addEventListener('mousedown', down);
  window.addEventListener('mouseup', up);
  el.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('touchend', up, { passive: false });
  window.addEventListener('touchcancel', up, { passive: false });
}

/* ---------------- State transitions ---------------- */
function setTarget(next) {
  if (targetState === next) return;
  targetState = next;

  // If switching to a different state, make sure both current & target groups are visible
  if (currentState !== targetState) {
    groups[currentState].visible = true;
    groups[targetState].visible = true;
    transitionT = 0; // start crossfade
  }
}

/* ---------------- Animation loop ---------------- */
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  // Update transition
  if (currentState !== targetState) {
    transitionT = Math.min(1, transitionT + dt / TRANSITION_TIME);
    const e = easeInOutCubic(transitionT);

    // Grow target, shrink current
    applyCrossfade(groups[currentState], groups[targetState], e);

    if (transitionT >= 1) {
      // Commit state
      groups[currentState].visible = false;
      currentState = targetState;

      // Reset target group to full visibility/scale
      resetGroupVisual(groups[currentState]);
    }
  }

  // Global hover/rotation
  const t = now * 0.001;
  const hover = Math.sin(t * 1.7) * 0.18;
  [groups.idle, groups.yes, groups.no].forEach(g => {
    g.position.y = hover;
    const rx = currentState === 'idle' ? 0.012 : 0.02;
    const ry = currentState === 'idle' ? 0.017 : 0.025;
    g.rotation.x += rx;
    g.rotation.y += ry;
  });

  // Nested pulsing (each visible group pulses; inner/outer with phase offset)
  pulseGroup(groups.idle, t, 1.0, 0.06, 0.0);   // (baseScale, amp, phase)
  pulseGroup(groups.yes,  t, 1.0, 0.05, 0.6);
  pulseGroup(groups.no,   t, 1.0, 0.05, 1.2);

  renderer.render(scene, camera);
}

/* ---------------- Helpers: pulsing & crossfade ---------------- */
function pulseGroup(group, t, base = 1.0, amp = 0.05, phase = 0) {
  if (!group.visible) return;
  const { inner, outer } = group.userData;

  // Outer breathes slightly slower and larger
  const sOuter = base * (1 + Math.sin(t * 2.1 + phase) * amp);
  const sInner = base * 0.75 * (1 + Math.sin(t * 2.6 + phase + Math.PI * 0.35) * (amp * 1.2));

  outer.scale.setScalar(sOuter);
  inner.scale.setScalar(sInner);

  // Opacity shimmer (very subtle)
  const opOuter = 0.8 + 0.1 * Math.sin(t * 2.0 + phase);
  const opInner = 0.6 + 0.1 * Math.sin(t * 2.7 + phase + 0.4);
  outer.material.opacity = THREE.MathUtils.clamp(opOuter, 0.2, 1.0);
  inner.material.opacity = THREE.MathUtils.clamp(opInner, 0.2, 1.0);
}

function applyCrossfade(fromGroup, toGroup, e) {
  // e: 0 -> 1
  // Scale: to grows from 0.6 to 1.0, from shrinks 1.0 -> 0.6
  const scaleFrom = 1.0 - 0.4 * e;
  const scaleTo   = 0.6 + 0.4 * e;

  setGroupScale(fromGroup, scaleFrom);
  setGroupScale(toGroup,   scaleTo);

  // Opacity crossfade on both inner & outer
  setGroupOpacity(fromGroup, 1.0 - e * 0.9);
  setGroupOpacity(toGroup,   0.1 + e * 0.9);

  // Ensure both visible during transition
  fromGroup.visible = true;
  toGroup.visible = true;
}

function resetGroupVisual(group) {
  setGroupScale(group, 1.0);
  setGroupOpacity(group, 0.9);
  group.visible = true;
}

function setGroupScale(group, s) {
  const { inner, outer } = group.userData;
  outer.scale.setScalar(s);
  inner.scale.setScalar(s * 0.75);
}

function setGroupOpacity(group, baseOp = 0.9) {
  const { inner, outer } = group.userData;
  outer.material.opacity = baseOp;
  inner.material.opacity = Math.max(0, baseOp - 0.25);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/* ---------------- Spiky geometry ---------------- */
function makeSpikyGeometry(baseGeom, { minAmp = 0.2, maxAmp = 0.5, seed = 42 } = {}) {
  const geom = baseGeom.toNonIndexed();
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  const rand = mulberry32(seed);

  // Per-vertex amplitude
  const amps = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    amps[i] = minAmp + (maxAmp - minAmp) * rand();
  }
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length() || 1.0;
    v.normalize();
    v.multiplyScalar(len + amps[i]);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  return geom;
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/* ---------------- Resize ---------------- */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
