import { useControls } from 'leva';

export function useMaterialControls() {
  return useControls('Material', {
    wireframe: true,
    metalness: { value: 0.8, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1.0, min: 0, max: 3, step: 0.1 }
  });
}

export function useAnimationControls() {
  return useControls('Animation', {
    hoverAmplitude: { value: 0.18, min: 0, max: 1, step: 0.01 },
    hoverFrequency: { value: 1.7, min: 0, max: 5, step: 0.1 },
    idlePulseAmp: { value: 0.06, min: 0, max: 0.2, step: 0.01 },
    yesPulseAmp: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
    noPulseAmp: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
    outerPulseFreq: { value: 2.1, min: 0, max: 10, step: 0.1 },
    innerPulseFreq: { value: 2.6, min: 0, max: 10, step: 0.1 },
    innerScaleRatio: { value: 0.75, min: 0.5, max: 1.0, step: 0.01 },
    innerPhaseOffset: { value: Math.PI * 0.35, min: 0, max: Math.PI * 2, step: 0.01 },
    innerAmpMultiplier: { value: 1.2, min: 0.5, max: 3, step: 0.1 },
    shimmerAmplitude: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
    shimmerMultiplier: { value: 0.5, min: 0, max: 2, step: 0.1 },
    transitionTime: { value: 300, min: 0, max: 2000, step: 10 }
  }, { collapsed: true });
}

export function useRotationControls() {
  return useControls('Rotation', {
    idleSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    yesSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    noSpeedMultiplier: { value: 1.0, min: 0, max: 3, step: 0.1 },
    outerInnerSpeedRatio: { value: 1.4, min: 0.5, max: 3, step: 0.1 }
  }, { collapsed: true });
}

export function useLightingControls() {
  return useControls('Lighting', {
    ambientLightIntensity: { value: 0.25, min: 0, max: 2, step: 0.01 },
    mainLightIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
    backLightIntensity: { value: 0.5, min: 0, max: 5, step: 0.1 },
    topLightIntensity: { value: 0.8, min: 0, max: 5, step: 0.1 }
  }, { collapsed: true });
}

export function useGeometryControls() {
  return useControls('Geometry', {
    idleGeometrySize: { value: 0.9, min: 0.3, max: 2, step: 0.05 },
    yesGeometrySize: { value: 1.05, min: 0.3, max: 2, step: 0.05 },
    noGeometrySize: { value: 0.7, min: 0.3, max: 2, step: 0.05 },
    noSpikyMinAmp: { value: 0.22, min: 0, max: 1, step: 0.01 },
    noSpikyMaxAmp: { value: 0.5, min: 0, max: 2, step: 0.01 },
    noSpikySeed: { value: 7331, min: 0, max: 10000, step: 1 }
  }, { collapsed: true });
}
