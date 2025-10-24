import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
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

  const handlePressStart = useCallback((state) => {
    setActiveButton(state);
    setTargetState(state);
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

  return (
    <div className="app">
      <Canvas
        camera={{ fov: 60, near: 0.05, far: 100, position: [0, 0, 4.2] }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight color={0x2266ff} intensity={0.25} />
        <Suspense fallback={null}>
          <BitScene targetState={targetState} />
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
    </div>
  );
}
