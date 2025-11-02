import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  useMaterialControls,
  useAnimationControls,
  useRotationControls,
  useLightingControls,
  useGeometryControls
} from './hooks/useAnimationControls.js';
import BitScene from './BitScene.jsx';
import './app.css';

const STATES = {
  idle: 'idle',
  yes: 'yes',
  no: 'no'
};

export default function App() {
  const [targetState, setTargetState] = useState(STATES.idle);
  const [activeButton, setActiveButton] = useState(null);
  const yesAudioRef = useRef(null);
  const noAudioRef = useRef(null);

  // Leva controls
  const materialConfig = useMaterialControls();
  const animationConfig = useAnimationControls();
  const rotationConfig = useRotationControls();
  const lightingConfig = useLightingControls();
  const geometryConfig = useGeometryControls();

  const handlePressStart = useCallback((state) => {
    setActiveButton(state);
    setTargetState(state);

    // Play corresponding audio
    if (state === STATES.yes && yesAudioRef.current) {
      yesAudioRef.current.currentTime = 0; // Reset to start
      yesAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
    } else if (state === STATES.no && noAudioRef.current) {
      noAudioRef.current.currentTime = 0; // Reset to start
      noAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    setActiveButton(null);
    setTargetState(STATES.idle);
  }, []);

  useEffect(() => {
    const handleBlur = () => handlePressEnd();
    const handleGlobalUp = () => activeButton && handlePressEnd();

    window.addEventListener('blur', handleBlur);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp, { passive: true });
    window.addEventListener('touchcancel', handleGlobalUp, { passive: true });

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
    };
  }, [activeButton, handlePressEnd]);

  // Loop audio while button is held
  useEffect(() => {
    const handleYesEnded = () => {
      if (activeButton === STATES.yes && yesAudioRef.current) {
        yesAudioRef.current.currentTime = 0;
        yesAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    };

    const handleNoEnded = () => {
      if (activeButton === STATES.no && noAudioRef.current) {
        noAudioRef.current.currentTime = 0;
        noAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    };

    const yesAudio = yesAudioRef.current;
    const noAudio = noAudioRef.current;

    if (yesAudio) {
      yesAudio.addEventListener('ended', handleYesEnded);
    }
    if (noAudio) {
      noAudio.addEventListener('ended', handleNoEnded);
    }

    return () => {
      if (yesAudio) {
        yesAudio.removeEventListener('ended', handleYesEnded);
      }
      if (noAudio) {
        noAudio.removeEventListener('ended', handleNoEnded);
      }
    };
  }, [activeButton]);

  return (
    <div className="app">
      <Canvas
        camera={{ fov: 60, near: 0.05, far: 100, position: [0, 0, 4.2] }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight color={0x2266ff} intensity={lightingConfig.ambientLightIntensity} />
        <Suspense fallback={null}>
          <BitScene
            targetState={targetState}
            materialConfig={materialConfig}
            animationConfig={animationConfig}
            rotationConfig={rotationConfig}
            lightingConfig={lightingConfig}
            geometryConfig={geometryConfig}
          />
        </Suspense>
      </Canvas>

      <div className="hint">
        Idle: Blue Icosahedra • Press & hold buttons to change state
      </div>

      <div className="ui">
        <button
          className="btn btn-yes"
          type="button"
          aria-pressed={activeButton === STATES.yes}
          onPointerDown={(e) => { e.preventDefault(); handlePressStart(STATES.yes); }}
          onPointerUp={(e) => { e.preventDefault(); handlePressEnd(); }}
          onPointerLeave={(e) => { if (e.buttons === 0) return; handlePressEnd(); }}
          onContextMenu={(e) => e.preventDefault()}
        >
          YES (Hold)
        </button>
        <button
          className="btn btn-no"
          type="button"
          aria-pressed={activeButton === STATES.no}
          onPointerDown={(e) => { e.preventDefault(); handlePressStart(STATES.no); }}
          onPointerUp={(e) => { e.preventDefault(); handlePressEnd(); }}
          onPointerLeave={(e) => { if (e.buttons === 0) return; handlePressEnd(); }}
          onContextMenu={(e) => e.preventDefault()}
        >
          NO (Hold)
        </button>
      </div>

      {/* Audio elements */}
      <audio ref={yesAudioRef} src="/bit-yes-original.mp3" preload="auto" />
      <audio ref={noAudioRef} src="/bit-no.mp3" preload="auto" />
    </div>
  );
}
