import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TRANSITION_TIME = 300; // ms
const STATES = {
  idle: 'idle',
  yes: 'yes',
  no: 'no'
};

const COLORS = {
  idle: 0x1ec8ff,
  yes: 0xffd400,
  no: 0xff6a00
};

const createIdleGeometry = (size = 0.9) => {
  // Create compound of dodecahedron and icosahedron
  const dodecahedron = new THREE.DodecahedronGeometry(size, 0);
  const icosahedron = new THREE.IcosahedronGeometry(size, 0);

  // Manually merge both geometries into a single compound geometry
  const dodecaPos = dodecahedron.attributes.position;
  const icosaPos = icosahedron.attributes.position;

  // Create new buffer with combined vertices
  const totalVertices = dodecaPos.count + icosaPos.count;
  const positions = new Float32Array(totalVertices * 3);

  // Copy dodecahedron vertices
  for (let i = 0; i < dodecaPos.count * 3; i++) {
    positions[i] = dodecaPos.array[i];
  }

  // Copy icosahedron vertices
  const offset = dodecaPos.count * 3;
  for (let i = 0; i < icosaPos.count * 3; i++) {
    positions[offset + i] = icosaPos.array[i];
  }

  // Create compound geometry
  const compound = new THREE.BufferGeometry();
  compound.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  compound.computeVertexNormals();
  compound.computeBoundingSphere();

  // Clean up individual geometries
  dodecahedron.dispose();
  icosahedron.dispose();

  return compound;
};
const createYesGeometry = (size = 1.05) => new THREE.BoxGeometry(size, size, size);
const createNoGeometry = (size = 0.7, minAmp = 0.22, maxAmp = 0.5, seed = 7331) =>
  makeSpikyGeometry(new THREE.IcosahedronGeometry(size, 2), { minAmp, maxAmp, seed });

export default function BitScene({ targetState, materialConfig, animationConfig, rotationConfig, lightingConfig, geometryConfig }) {
  const idle = useBitGroup(() => createIdleGeometry(geometryConfig.idleGeometrySize), COLORS.idle, 101, materialConfig, geometryConfig);
  const yes = useBitGroup(() => createYesGeometry(geometryConfig.yesGeometrySize), COLORS.yes, 202, materialConfig, geometryConfig);
  const no = useBitGroup(() => createNoGeometry(geometryConfig.noGeometrySize, geometryConfig.noSpikyMinAmp, geometryConfig.noSpikyMaxAmp, geometryConfig.noSpikySeed), COLORS.no, 303, materialConfig, geometryConfig);

  const currentState = useRef(STATES.idle);
  const transitionT = useRef(1);

  useEffect(() => {
    if (!idle.groupRef.current || !yes.groupRef.current || !no.groupRef.current) return;
    resetGroupVisual(idle);
    yes.groupRef.current.visible = false;
    no.groupRef.current.visible = false;
    setGroupScale(yes, 0.6);
    setGroupOpacity(yes, 0.1);
    setGroupScale(no, 0.6);
    setGroupOpacity(no, 0.1);
  }, [idle, yes, no]);

  useEffect(() => {
    if (targetState === currentState.current || !isReady(idle, yes, no)) return;

    const current = resolveGroup(currentState.current, idle, yes, no);
    const target = resolveGroup(targetState, idle, yes, no);

    if (!current || !target) return;

    if (current.groupRef.current) current.groupRef.current.visible = true;
    if (target.groupRef.current) target.groupRef.current.visible = true;
    transitionT.current = 0;
  }, [targetState, idle, yes, no]);

  useFrame((state, delta) => {
    if (!isReady(idle, yes, no)) return;

    const from = resolveGroup(currentState.current, idle, yes, no);
    const to = resolveGroup(targetState, idle, yes, no);

    if (currentState.current !== targetState && from && to) {
      transitionT.current = Math.min(1, transitionT.current + (delta * 1000) / animationConfig.transitionTime);
      const eased = easeInOutCubic(transitionT.current);
      applyCrossfade(from, to, eased);

      if (transitionT.current >= 1) {
        if (from.groupRef.current) {
          from.groupRef.current.visible = false;
        }
        currentState.current = targetState;
        resetGroupVisual(resolveGroup(currentState.current, idle, yes, no));
      }
    }

    const hover = Math.sin(state.clock.elapsedTime * animationConfig.hoverFrequency) * animationConfig.hoverAmplitude;
    [idle, yes, no].forEach((group) => {
      if (group.groupRef.current) group.groupRef.current.position.y = hover;
    });

    rotateGroup(idle, delta, rotationConfig, STATES.idle);
    rotateGroup(yes, delta, rotationConfig, STATES.yes);
    rotateGroup(no, delta, rotationConfig, STATES.no);

    const t = state.clock.elapsedTime;
    pulseGroup(idle, t, 1.0, animationConfig.idlePulseAmp, 0.0, animationConfig);
    pulseGroup(yes, t, 1.0, animationConfig.yesPulseAmp, 0.6, animationConfig);
    pulseGroup(no, t, 1.0, animationConfig.noPulseAmp, 1.2, animationConfig);
  });

  return (
    <>
      {/* Enhanced lighting for metallic materials */}
      <directionalLight position={[5, 5, 5]} intensity={lightingConfig.mainLightIntensity} color={0xffffff} />
      <directionalLight position={[-5, -5, -5]} intensity={lightingConfig.backLightIntensity} color={0x4488ff} />
      <pointLight position={[0, 5, 0]} intensity={lightingConfig.topLightIntensity} color={0xffffff} />

      <BitGroup bundle={idle} />
      <BitGroup bundle={yes} />
      <BitGroup bundle={no} />
    </>
  );
}

function BitGroup({ bundle }) {
  return (
    <group ref={bundle.groupRef} visible={false}>
      <mesh ref={bundle.outerRef} geometry={bundle.geometries.outer} material={bundle.materials.outer} />
      <mesh
        ref={bundle.innerRef}
        geometry={bundle.geometries.inner}
        material={bundle.materials.inner}
        scale={[0.75, 0.75, 0.75]}
      />
    </group>
  );
}

function useBitGroup(createGeometry, colorHex, seed, materialConfig) {
  const groupRef = useRef();
  const outerRef = useRef();
  const innerRef = useRef();

  const geometries = useMemo(() => {
    const outer = createGeometry();
    const inner = outer.clone ? outer.clone() : outer;
    return { outer, inner };
  }, [createGeometry]);

  const materials = useMemo(() => {
    if (!materialConfig) {
      // Default wireframe materials
      return {
        outer: new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.9 }),
        inner: new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.65 })
      };
    }

    const { wireframe, metalness, roughness, envMapIntensity } = materialConfig;

    if (wireframe) {
      // Wireframe mode: use MeshBasicMaterial
      return {
        outer: new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.9 }),
        inner: new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.65 })
      };
    } else {
      // Opaque mode: use MeshStandardMaterial with metallic properties
      return {
        outer: new THREE.MeshStandardMaterial({
          color: colorHex,
          wireframe: false,
          metalness,
          roughness,
          envMapIntensity
        }),
        inner: new THREE.MeshStandardMaterial({
          color: colorHex,
          wireframe: false,
          metalness,
          roughness,
          envMapIntensity
        })
      };
    }
  }, [colorHex, materialConfig]);

  const dynamics = useMemo(() => {
    const rnd = mulberry32(seed);
    const axisOuter = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const axisInner = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const precessAxis = new THREE.Vector3(rnd(), rnd(), rnd()).normalize();
    const speedOuter = 0.7 + rnd() * 0.4;
    const speedInner = 1.0 + rnd() * 0.6;
    const precessSpeed = 0.15 + rnd() * 0.1;

    return { axisOuter, axisInner, precessAxis, speedOuter, speedInner, precessSpeed };
  }, [seed]);

  useEffect(() => {
    const { outer, inner } = geometries;
    const { outer: outerMat, inner: innerMat } = materials;
    return () => {
      outer.dispose();
      if (inner !== outer) inner.dispose();
      outerMat.dispose();
      innerMat.dispose();
    };
  }, [geometries, materials]);

  return useMemo(
    () => ({
      groupRef,
      outerRef,
      innerRef,
      geometries,
      materials,
      dynamics
    }),
    [geometries, materials, dynamics]
  );
}

function isReady(...groups) {
  return groups.every((group) => group.groupRef.current && group.innerRef.current && group.outerRef.current);
}

function resolveGroup(state, idle, yes, no) {
  switch (state) {
    case STATES.idle:
      return idle;
    case STATES.yes:
      return yes;
    case STATES.no:
      return no;
    default:
      return idle;
  }
}

function rotateGroup(bundle, delta, rotationConfig, state) {
  if (!bundle.groupRef.current?.visible) return;
  const { axisOuter, axisInner, precessAxis, speedOuter, speedInner, precessSpeed } = bundle.dynamics;
  const group = bundle.groupRef.current;
  const outer = bundle.outerRef.current;
  const inner = bundle.innerRef.current;

  // Get speed multiplier based on state
  let speedMultiplier = 1.0;
  if (state === STATES.idle) speedMultiplier = rotationConfig.idleSpeedMultiplier;
  else if (state === STATES.yes) speedMultiplier = rotationConfig.yesSpeedMultiplier;
  else if (state === STATES.no) speedMultiplier = rotationConfig.noSpeedMultiplier;

  group.rotateOnAxis(precessAxis, precessSpeed * delta * speedMultiplier);
  outer.rotateOnAxis(axisOuter, speedOuter * delta * speedMultiplier);
  inner.rotateOnAxis(axisInner, speedInner * delta * speedMultiplier * rotationConfig.outerInnerSpeedRatio);
}

function pulseGroup(bundle, t, base = 1.0, amp = 0.05, phase = 0, animationConfig) {
  if (!bundle.groupRef.current?.visible) return;
  const outer = bundle.outerRef.current;
  const inner = bundle.innerRef.current;

  const baseScale = bundle.scaleBase ?? base;
  const baseOpacity = bundle.opacityBase ?? 0.9;
  const baseInnerOpacity = Math.max(0, baseOpacity - 0.25);

  const sOuter = baseScale * (1 + Math.sin(t * animationConfig.outerPulseFreq + phase) * amp);
  const sInner = baseScale * animationConfig.innerScaleRatio * (1 + Math.sin(t * animationConfig.innerPulseFreq + phase + animationConfig.innerPhaseOffset) * (amp * animationConfig.innerAmpMultiplier));
  outer.scale.setScalar(sOuter);
  inner.scale.setScalar(sInner);

  // Only apply opacity changes in wireframe mode (MeshBasicMaterial with transparent)
  if (outer.material.transparent) {
    const shimmerOuter = animationConfig.shimmerAmplitude * Math.sin(t * 2.0 + phase);
    const shimmerInner = animationConfig.shimmerAmplitude * Math.sin(t * 2.7 + phase + 0.4);
    outer.material.opacity = THREE.MathUtils.clamp(baseOpacity + shimmerOuter * animationConfig.shimmerMultiplier, 0.05, 1.0);
    inner.material.opacity = THREE.MathUtils.clamp(baseInnerOpacity + shimmerInner * animationConfig.shimmerMultiplier, 0.05, 1.0);
  }
}

function applyCrossfade(fromBundle, toBundle, e) {
  const scaleFrom = 1.0 - 0.4 * e;
  const scaleTo = 0.6 + 0.4 * e;

  setGroupScale(fromBundle, scaleFrom);
  setGroupScale(toBundle, scaleTo);

  setGroupOpacity(fromBundle, 1.0 - e * 0.9);
  setGroupOpacity(toBundle, 0.1 + e * 0.9);

  if (fromBundle.groupRef.current) fromBundle.groupRef.current.visible = true;
  if (toBundle.groupRef.current) toBundle.groupRef.current.visible = true;
}

function resetGroupVisual(bundle) {
  if (!bundle) return;
  setGroupScale(bundle, 1.0);
  setGroupOpacity(bundle, 0.9);
  if (bundle.groupRef.current) bundle.groupRef.current.visible = true;
}

function setGroupScale(bundle, scalar) {
  const outer = bundle.outerRef.current;
  const inner = bundle.innerRef.current;
  if (!outer || !inner) return;

  bundle.scaleBase = scalar;
  outer.scale.setScalar(scalar);
  inner.scale.setScalar(scalar * 0.75);
}

function setGroupOpacity(bundle, baseOp = 0.9) {
  const outer = bundle.outerRef.current;
  const inner = bundle.innerRef.current;
  if (!outer || !inner) return;

  bundle.opacityBase = baseOp;

  // Only set opacity in wireframe mode (when material supports transparency)
  if (outer.material.transparent) {
    outer.material.opacity = baseOp;
    inner.material.opacity = Math.max(0, baseOp - 0.25);
  }
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function makeSpikyGeometry(baseGeom, { minAmp = 0.2, maxAmp = 0.5, seed = 42 } = {}) {
  const geom = baseGeom.toNonIndexed();
  baseGeom.dispose();
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  const rand = mulberry32(seed);

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
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
