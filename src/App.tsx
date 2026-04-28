import { useAmbientMusic } from '@/hooks/useAmbientMusic';
import { useCheatDetection } from '@/hooks/useCheatDetection';
import { I18nProvider } from '@/hooks/useI18nProvider';
import { useKonamiCode } from '@/hooks/useKonamiCode';
import { useStore } from '@/store/useStore';
import { CrabProvider } from '@core/CrabContext';
import { Scene } from '@core/Scene';
import { useJoystickMovement } from '@hooks/useJoystickMovement';
import { useTouchDevice } from '@hooks/useTouchDevice';
import { useWebGLDetection } from '@hooks/useWebGLDetection';
import { useAccessoryUnlocker } from '@interactions/AccessoryUnlocker';
import { CheatDetectedModal } from '@ui/components/CheatDetectedModal';
import { Controls } from '@ui/components/Controls';
import { InfoPanel } from '@ui/components/InfoPanel';
import { IntroOverlay as IntroScene } from '@ui/components/IntroScene';
import { MainLayout } from '@ui/layouts/MainLayout';
import { lazy, Suspense, useMemo, useState } from 'react';
import './ui/styles/tunic-theme.css';

const isFr = typeof navigator !== 'undefined' && navigator.language.startsWith('fr');

// Lazy load non-critical components for better performance
const CVModal = lazy(() =>
  import('@ui/components/CVModal').then((module) => ({ default: module.CVModal }))
);
const MasterpiecePage = lazy(() =>
  import('@ui/components/MasterpiecePage').then((module) => ({ default: module.MasterpiecePage }))
);
const ProgressMap = lazy(() =>
  import('@ui/components/ProgressMap').then((module) => ({ default: module.ProgressMap }))
);
const RetroTerminal = lazy(() =>
  import('@ui/components/RetroTerminal').then((module) => ({ default: module.RetroTerminal }))
);
const SecurityKeypadModal = lazy(() =>
  import('@ui/components/SecurityKeypadModal').then((module) => ({
    default: module.SecurityKeypadModal,
  }))
);
const Settings = lazy(() =>
  import('@ui/components/Settings').then((module) => ({ default: module.Settings }))
);
const VirtualJoystick = lazy(() =>
  import('@ui/components/VirtualJoystick').then((module) => ({ default: module.VirtualJoystick }))
);
const MobileButtons = lazy(() =>
  import('@ui/components/MobileButtons').then((module) => ({ default: module.MobileButtons }))
);
const PortraitWarning = lazy(() =>
  import('@ui/components/PortraitWarning').then((module) => ({
    default: module.PortraitWarning,
  }))
);

function App() {
  const { isSupported, isLoading, error } = useWebGLDetection();
  const isTouchDevice = useTouchDevice();
  const joystick = useJoystickMovement();
  const { showIntro, setShowIntro, isSecurityKeypadOpen } = useStore();
  const [cheatDetected, setCheatDetected] = useState(false);

  // Ambient music - get tryPlay function to trigger music on mobile
  const { tryPlay: tryPlayMusic } = useAmbientMusic();

  // Easter egg tracking
  useAccessoryUnlocker();

  // Konami Code detection
  useKonamiCode();

  // Cheat detection system
  useCheatDetection(() => {
    setCheatDetected(true);
  });

  // Check for masterpiece code
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isMasterpieceCode = urlParams.get('code') === '325a5651';

  // Show loading state during WebGL detection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-blue-100 font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 text-lg">
            {isFr ? 'Chargement du portfolio...' : 'Loading portfolio...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to fallback HTML if WebGL is not supported
  if (!isSupported) {
    console.warn('WebGL not supported, redirecting to fallback:', error);

    // Show error message with fallback option
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-blue-100 font-sans p-8">
        <div className="max-w-xl bg-white rounded-xl p-8 shadow-lg text-center">
          <h1 className="text-gray-800 mb-4 text-2xl font-bold">
            {isFr ? 'WebGL Non Supporté' : 'WebGL Not Supported'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isFr
              ? "Votre navigateur ne supporte pas WebGL, qui est requis pour l'expérience 3D interactive."
              : 'Your browser does not support WebGL, which is required for the interactive 3D experience.'}
          </p>
          {error && (
            <p className="bg-yellow-50 border border-yellow-400 rounded-md p-4 text-yellow-800 mb-6">
              <strong>{isFr ? 'Détails' : 'Details'} :</strong> {error}
            </p>
          )}
          <a
            href="/fallback.html"
            className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white no-underline rounded-lg font-semibold transition-colors"
          >
            {isFr ? 'Voir la version HTML du portfolio' : 'View HTML version of the portfolio'}
          </a>
        </div>
      </div>
    );
  }

  if (isMasterpieceCode) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            {isFr ? 'Chargement...' : 'Loading...'}
          </div>
        }
      >
        <MasterpiecePage />
      </Suspense>
    );
  }

  return (
    <I18nProvider>
      <MainLayout>
        <CrabProvider joystickMovement={joystick.getMovementDirection}>
          <Scene showStats={import.meta.env.DEV} />
          {showIntro && <IntroScene onCrabClick={() => setShowIntro(false)} />}
          <Controls />
          <InfoPanel />
          <Suspense fallback={null}>
            <CVModal />
          </Suspense>
          <Suspense fallback={null}>{isSecurityKeypadOpen && <SecurityKeypadModal />}</Suspense>
          <Suspense fallback={null}>
            <Settings />
          </Suspense>
          <Suspense fallback={null}>
            <RetroTerminal />
          </Suspense>
          <Suspense fallback={null}>
            <ProgressMap />
          </Suspense>
          {isTouchDevice && (
            <Suspense fallback={null}>
              <VirtualJoystick
                onMove={joystick.handleJoystickMove}
                onStop={joystick.handleJoystickStop}
                onFirstTouch={tryPlayMusic}
              />
              <MobileButtons onFirstTouch={tryPlayMusic} />
              <PortraitWarning />
            </Suspense>
          )}
          {/* <DebugPanel /> */}
          <CheatDetectedModal isOpen={cheatDetected} />
        </CrabProvider>
      </MainLayout>
    </I18nProvider>
  );
}

export default App;
