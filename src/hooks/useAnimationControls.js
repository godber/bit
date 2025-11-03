import { useControls } from 'leva';
import { isDebugEnabled } from '../utils/debug.js';

export function useMaterialControls() {
  if (!isDebugEnabled()) {
    return {
      wireframe: false,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0
    };
  }

  return useControls('Material', {
    wireframe: false,
    metalness: { value: 0.8, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1.0, min: 0, max: 3, step: 0.1 }
  });
}

export function useAnimationControls() {
  if (!isDebugEnabled()) {
    return {
      hoverAmplitude: 0.18,
      hoverFrequency: 1.7,
      idlePulseAmp: 0.06,
      yesPulseAmp: 0.05,
      noPulseAmp: 0.05,
      outerPulseFreq: 2.1,
      innerPulseFreq: 2.6,
      innerScaleRatio: 0.92,
      innerPhaseOffset: Math.PI * 0.35,
      innerAmpMultiplier: 1.2,
      shimmerAmplitude: 0.1,
      shimmerMultiplier: 0.5,
      transitionTime: 300
    };
  }

  return useControls('Animation', {
    hoverAmplitude: { value: 0.18, min: 0, max: 1, step: 0.01 },
    hoverFrequency: { value: 1.7, min: 0, max: 5, step: 0.1 },
    idlePulseAmp: { value: 0.06, min: 0, max: 0.2, step: 0.01 },
    yesPulseAmp: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
    noPulseAmp: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
    outerPulseFreq: { value: 2.1, min: 0, max: 10, step: 0.1 },
    innerPulseFreq: { value: 2.6, min: 0, max: 10, step: 0.1 },
    innerScaleRatio: { value: 0.92, min: 0.5, max: 1.0, step: 0.01 },
    innerPhaseOffset: { value: Math.PI * 0.35, min: 0, max: Math.PI * 2, step: 0.01 },
    innerAmpMultiplier: { value: 1.2, min: 0.5, max: 3, step: 0.1 },
    shimmerAmplitude: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
    shimmerMultiplier: { value: 0.5, min: 0, max: 2, step: 0.1 },
    transitionTime: { value: 300, min: 0, max: 2000, step: 10 }
  }, { collapsed: true });
}

export function useRotationControls() {
  if (!isDebugEnabled()) {
    return {
      idleSpeedMultiplier: 1.0,
      yesSpeedMultiplier: 1.0,
      noSpeedMultiplier: 1.0,
      outerInnerSpeedRatio: 1.4
    };
  }

  return useControls('Rotation', {
    idleSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    yesSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    noSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    outerInnerSpeedRatio: { value: 1.4, min: 0.5, max: 3, step: 0.1 }
  }, { collapsed: true });
}

export function useLightingControls() {
  if (!isDebugEnabled()) {
    return {
      ambientLightIntensity: 0.25,
      mainLightIntensity: 1.5,
      backLightIntensity: 0.5,
      topLightIntensity: 0.8
    };
  }

  return useControls('Lighting', {
    ambientLightIntensity: { value: 0.25, min: 0, max: 2, step: 0.01 },
    mainLightIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
    backLightIntensity: { value: 0.5, min: 0, max: 5, step: 0.1 },
    topLightIntensity: { value: 0.8, min: 0, max: 5, step: 0.1 }
  }, { collapsed: true });
}

export function useGeometryControls() {
  if (!isDebugEnabled()) {
    return {
      idleGeometrySize: 0.9,
      yesGeometrySize: 1.05,
      noGeometrySize: 0.7,
      noStellationHeight: 0.5
    };
  }

  return useControls('Geometry', {
    idleGeometrySize: { value: 0.9, min: 0.3, max: 2, step: 0.05 },
    yesGeometrySize: { value: 1.05, min: 0.3, max: 2, step: 0.05 },
    noGeometrySize: { value: 0.7, min: 0.3, max: 2, step: 0.05 },
    noStellationHeight: { value: 0.5, min: 0.1, max: 1.5, step: 0.05 }
  }, { collapsed: true });
}
