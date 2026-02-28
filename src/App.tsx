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
import { lazy, Suspense, useState } from 'react';
import './ui/styles/tunic-theme.css';

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

function App() {
  const { isSupported, isLoading, error } = useWebGLDetection();
  const isTouchDevice = useTouchDevice();
  const joystick = useJoystickMovement();
  const { showIntro, setShowIntro, isSecurityKeypadOpen } = useStore();
  const [cheatDetected, setCheatDetected] = useState(false);

  // Ambient music
  useAmbientMusic();

  // Easter egg tracking
  useAccessoryUnlocker();

  // Konami Code detection
  useKonamiCode();

  // Cheat detection system
  useCheatDetection(() => {
    setCheatDetected(true);
  });

  // Check for masterpiece code
  const urlParams = new URLSearchParams(window.location.search);
  const isMasterpieceCode = urlParams.get('code') === '325a5651';

  // Show loading state during WebGL detection
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #4a90e2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#2c3e50', fontSize: '1.2rem' }}>Chargement du portfolio...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Redirect to fallback HTML if WebGL is not supported
  if (!isSupported) {
    console.warn('WebGL not supported, redirecting to fallback:', error);

    // Show error message with fallback option
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>WebGL Non Supporté</h1>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>
            Votre navigateur ne supporte pas WebGL, qui est requis pour l'expérience 3D interactive.
          </p>
          {error && (
            <p
              style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '1rem',
                color: '#856404',
                marginBottom: '1.5rem',
              }}
            >
              <strong>Détails :</strong> {error}
            </p>
          )}
          <a
            href="/fallback.html"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: '#4a90e2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'background 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#357abd')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#4a90e2')}
          >
            Voir la version HTML du portfolio
          </a>
        </div>
      </div>
    );
  }

  if (isMasterpieceCode) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
            }}
          >
            Chargement...
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
              />
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
