import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { useStore } from '../store';

type LoadingScreenProps = {
  onComplete?: () => void;
};

type LoadingState = 'LOADING' | 'COMPLETE' | 'EXITING';

const getLoadingMessage = (progress: number) => {
  if (progress >= 100) return "alright, let's go.";
  if (progress >= 81) return "okay, we're getting somewhere";
  if (progress >= 61) return "almost there";
  if (progress >= 41) return "putting some things together";
  if (progress >= 21) return "getting things ready";

  return "okay, give me a second...";
};

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { progress, active, errors, loaded, total } = useProgress();
  const enter = useStore((s) => s.enter);
  const heroModelReady = useStore((s) => s.heroModelReady);
  const theme = useStore((s) => s.theme);

  const [loadingState, setLoadingState] = useState<LoadingState>('LOADING');
  const [isRemoved, setIsRemoved] = useState(false);

  // Normalize progress to integer [0, 100]
  const normalizedProgress = Math.min(
    100,
    Math.max(0, Math.round(Number.isFinite(progress) ? progress : 0))
  );

  // Once complete, always lock display at 100%
  const displayProgress = loadingState === 'LOADING' ? normalizedProgress : 100;

  const message = useMemo(
    () => getLoadingMessage(displayProgress),
    [displayProgress]
  );

  // Gracefully log any asset loading errors
  useEffect(() => {
    if (errors.length > 0) {
      console.warn('[TOBI XP] Asset loading errors:', errors);
    }
  }, [errors]);

  // Progression & Completion detection
  useEffect(() => {
    if (loadingState !== 'LOADING') return;

    // Standard completion (100%), cached completion (!active and loaded >= total),
    // zero-asset / instant load (!active && total === 0), or non-blocking error completion
    // MUST also require heroModelReady (Hero 3D model loaded, added to scene, mounted, and rendered)
    const isFinished =
      (normalizedProgress >= 100 ||
       (!active && total > 0 && loaded >= total) ||
       (!active && total === 0 && progress >= 100) ||
       (!active && errors.length > 0)) &&
      heroModelReady;

    if (isFinished) {
      setLoadingState('COMPLETE');
    }
  }, [normalizedProgress, active, loaded, total, progress, errors, loadingState, heroModelReady]);

  // Safety fallback: prevent the portfolio from ever remaining permanently stuck
  useEffect(() => {
    if (loadingState !== 'LOADING') return;

    const safetyTimer = setTimeout(() => {
      console.info('[TOBI XP] Loading safety fallback triggered');
      setLoadingState('COMPLETE');
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, [loadingState]);

  // Hold completed state briefly so the user sees 100% and "alright, let's go.",
  // synchronizing with R3F render frame before starting the curtain slide
  useEffect(() => {
    if (loadingState !== 'COMPLETE') return;

    const holdTimer = setTimeout(() => {
      const frame = requestAnimationFrame(() => {
        setLoadingState('EXITING');
        enter();
      });
      return () => cancelAnimationFrame(frame);
    }, 450);

    return () => clearTimeout(holdTimer);
  }, [loadingState, enter]);

  // Lock body scroll while loading screen is active, restore upon exit
  useEffect(() => {
    if (loadingState === 'LOADING' || loadingState === 'COMPLETE') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [loadingState])

  if (isRemoved) return null;

  return (
    <motion.div
      className="loading-screen"
      data-theme={theme}
      initial={{ y: 0 }}
      animate={{
        y: loadingState === 'EXITING' ? '-100%' : '0%',
      }}
      style={{
        pointerEvents: loadingState === 'EXITING' ? 'none' : 'auto',
      }}
      transition={{
        duration: 1.05,
        ease: [0.76, 0, 0.24, 1],
      }}
      onAnimationComplete={() => {
        if (loadingState === 'EXITING') {
          setIsRemoved(true);
          onComplete?.();
        }
      }}
    >
      <div className="loading-screen__top">
        <div className="loading-screen__name">
          TOBI
        </div>

        <div className="loading-screen__top-right">
          <div className="loading-screen__xp">
            XP
          </div>
          <div className="loading-screen__descriptor">
            FIGURING IT OUT AS I GO.
          </div>
        </div>
      </div>

      <div className="loading-screen__bottom">
        <div className="loading-screen__progress-info">
          <div className="loading-screen__percentage">
            {displayProgress}%
          </div>

          <div
            className="loading-screen__message"
            aria-live="polite"
          >
            {message}
          </div>
        </div>

        <div className="loading-screen__progress">
          <div className="loading-screen__progress-track">
            <div
              className="loading-screen__progress-fill"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </div>

          <div className="loading-screen__ticks" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, index) => (
              <span
                key={index}
                className={index < (displayProgress / 100) * 40 ? 'is-active' : ''}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
