import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store/useStore';

/**
 * Controls Component
 * Displays keyboard controls instructions
 * Can be dismissed after first view
 */
export function Controls() {
  const { t } = useI18n();
  const { controlsVisible, hideControls } = useStore();

  if (!controlsVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(232, 220, 196, 0.95)',
        padding: '1.5rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 1000,
        maxWidth: '500px',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.2rem' }}>
        🦀 {t('controls.title')}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          color: '#555',
        }}
      >
        <div>
          <strong>{t('controls.wasd')}</strong> - {t('controls.move')}
        </div>
        <div>
          <strong>{t('controls.keyInteract')}</strong> - {t('controls.interact')}
        </div>
        <div>
          <strong>{t('controls.keyMap')}</strong> - {t('controls.map')}
        </div>
        <div>
          <strong>{t('controls.keyEsc')}</strong> - {t('controls.settings')}
        </div>
      </div>
      <button
        onClick={hideControls}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1.5rem',
          background: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          width: '100%',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#357abd')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#4a90e2')}
      >
        {t('controls.understood')}
      </button>
    </div>
  );
}
