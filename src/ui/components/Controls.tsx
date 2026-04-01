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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-tunic-beige/95 px-8 py-6 rounded-xl shadow-lg font-sans z-[1000] max-w-lg">
      <h3 className="mb-4 text-tunic-steel text-lg font-bold">🦀 {t('controls.title')}</h3>
      <div className="grid grid-cols-2 gap-3 text-gray-600">
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
        className="mt-4 w-full py-2 px-6 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-md cursor-pointer font-semibold transition-colors"
      >
        {t('controls.understood')}
      </button>
    </div>
  );
}
