import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js';

let scene, camera, renderer;
let bit, targetGeometry;
let isYes = false; // start as NO (cube)

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 4;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Bit materials: glowing wireframe
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
  });

  // Start as cube (NO)
  const geom = new THREE.BoxGeometry(1, 1, 1);
  bit = new THREE.Mesh(geom, mat);
  scene.add(bit);

  // Lighting (subtle ambient)
  const light = new THREE.AmbientLight(0x00ffff, 0.5);
  scene.add(light);

  window.addEventListener('resize', onWindowResize);

  document.getElementById('toggle').addEventListener('click', toggleState);
}

function toggleState() {
  isYes = !isYes;
  const newGeom = isYes ? new THREE.IcosahedronGeometry(0.8, 0) : new THREE.BoxGeometry(1, 1, 1);

  // Smooth morph by interpolating vertices
  const oldGeom = bit.geometry;
  morphGeometry(oldGeom, newGeom);
}

function morphGeometry(oldGeom, newGeom) {
  // We'll just replace geometry for simplicity
  bit.geometry.dispose();
  bit.geometry = newGeom;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  bit.rotation.x += 0.01;
  bit.rotation.y += 0.015;
  bit.position.y = Math.sin(Date.now() * 0.002) * 0.2; // hovering effect
  renderer.render(scene, camera);
}
