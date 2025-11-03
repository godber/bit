import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  useMaterialControls,
  useAnimationControls,
  useRotationControls,
  useLightingControls,
  useGeometryControls
} from './hooks/useAnimationControls.js';
import { isDebugEnabled } from './utils/debug.js';
import BitScene from './BitScene.jsx';
import './app.css';
import './utils/debug.js'; // Initialize debug console utilities

const STATES = {
  idle: 'idle',
  yes: 'yes',
  no: 'no'
};

export default function App() {
  const [targetState, setTargetState] = useState(STATES.idle);
  const [activeButton, setActiveButton] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [audioReady, setAudioReady] = useState({ yes: false, no: false });
  const yesAudioRef = useRef(null);
  const noAudioRef = useRef(null);
  const stateChangeTimeRef = useRef(0);

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

  const handleAskQuestion = useCallback(() => {
    if (isAnswering || !questionText.trim()) return;

    setIsAnswering(true);

    // Random delay between 0.5s and 1.5s
    const delay = 500 + Math.random() * 1000;

    setTimeout(() => {
      let answer;
      let repeatCount = 1;

      const question = questionText.trim().toLowerCase();

      // Check for secret triggers
      if (question === 'aayy') {
        answer = STATES.yes;
        repeatCount = 3;
      } else if (question === 'aann') {
        answer = STATES.no;
        repeatCount = 4;
      } else if (question === 'aay') {
        answer = STATES.yes;
        repeatCount = 1;
      } else if (question === 'aan') {
        answer = STATES.no;
        repeatCount = 1;
      } else {
        // Normal random behavior
        const rand = Math.random();

        // 5% chance for "yes yes yes" (3 times)
        if (rand < 0.05) {
          answer = STATES.yes;
          repeatCount = 3;
        }
        // 5% chance for "no no no no" (4 times)
        else if (rand < 0.10) {
          answer = STATES.no;
          repeatCount = 4;
        }
        // 90% chance for single answer (45% yes, 45% no)
        else {
          answer = rand < 0.55 ? STATES.yes : STATES.no;
          repeatCount = 1;
        }
      }

      const audioRef = answer === STATES.yes ? yesAudioRef : noAudioRef;

      // Track when state change started
      stateChangeTimeRef.current = Date.now();

      // Trigger visual state change
      setTargetState(answer);

      // Play audio multiple times if needed
      let playCount = 0;
      const playAudio = () => {
        if (playCount < repeatCount && audioRef.current) {
          const audio = audioRef.current;

          // Add ended listener BEFORE playing to avoid race condition
          const handleEnded = () => {
            audio.removeEventListener('ended', handleEnded);
            playCount++;

            if (playCount < repeatCount) {
              playAudio();
            } else {
              // All plays done, ensure minimum display time (800ms to account for transitions)
              const elapsed = Date.now() - stateChangeTimeRef.current;
              const minDisplayTime = 800;
              const remainingTime = Math.max(0, minDisplayTime - elapsed);

              setTimeout(() => {
                setTargetState(STATES.idle);
                setIsAnswering(false);
                setQuestionText('');
              }, remainingTime);
            }
          };

          audio.addEventListener('ended', handleEnded);
          audio.currentTime = 0;
          audio.play().catch(err => {
            console.log('Audio play failed:', err);
            // If play fails, still trigger the ended handler after a delay
            audio.removeEventListener('ended', handleEnded);
            setTimeout(handleEnded, 500);
          });
        }
      };

      playAudio();
    }, delay);
  }, [isAnswering, questionText]);

  // Track audio loading state
  useEffect(() => {
    const yesAudio = yesAudioRef.current;
    const noAudio = noAudioRef.current;

    const handleYesCanPlay = () => setAudioReady(prev => ({ ...prev, yes: true }));
    const handleNoCanPlay = () => setAudioReady(prev => ({ ...prev, no: true }));

    if (yesAudio) {
      yesAudio.addEventListener('canplaythrough', handleYesCanPlay);
      // If already loaded
      if (yesAudio.readyState >= 3) {
        setAudioReady(prev => ({ ...prev, yes: true }));
      }
    }

    if (noAudio) {
      noAudio.addEventListener('canplaythrough', handleNoCanPlay);
      // If already loaded
      if (noAudio.readyState >= 3) {
        setAudioReady(prev => ({ ...prev, no: true }));
      }
    }

    return () => {
      if (yesAudio) {
        yesAudio.removeEventListener('canplaythrough', handleYesCanPlay);
      }
      if (noAudio) {
        noAudio.removeEventListener('canplaythrough', handleNoCanPlay);
      }
    };
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

      <div className="chat-box">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask me any question ..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isAnswering) {
              handleAskQuestion();
            }
          }}
          disabled={isAnswering}
        />
        <button
          className="btn btn-ask"
          onClick={handleAskQuestion}
          disabled={isAnswering || !questionText.trim() || !audioReady.yes || !audioReady.no}
        >
          {!audioReady.yes || !audioReady.no ? 'Loading...' : isAnswering ? 'Thinking...' : 'Ask'}
        </button>
      </div>

      {isDebugEnabled() && (
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
      )}

      {/* Audio elements */}
      <audio ref={yesAudioRef} src="/bit-yes-original.mp3" preload="auto" />
      <audio ref={noAudioRef} src="/bit-no.mp3" preload="auto" />
    </div>
  );
}
