import { useI18n } from '@/hooks/useI18n';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useStore } from '@/store/useStore';
import type { AccessoryType } from '@entities/Crab/Accessory';
import { getUnlockProgress, UNLOCK_CONDITIONS } from '@interactions/AccessoryUnlocker';
import { Globe, Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Settings Component
 * Allows user to toggle sound, adjust volume, and change graphics quality
 *
 * Accessed via wrench object on desk or keyboard shortcut (S key)
 */
export function Settings() {
  const {
    soundEnabled,
    volume,
    keyboardLayout,
    toggleSound,
    setVolume,
    setKeyboardLayout,
    ambientMusicEnabled,
    ambientMusicPlaying,
    ambientMusicVolume,
    setAmbientMusic,
    setAmbientMusicVolume,
    equippedAccessory,
    equipAccessory,
    isAccessoryUnlocked,
    isSettingsOpen,
    closeSettings,
    toggleSettings,
  } = useStore();
  const keys = useKeyboard();

  useEffect(() => {
    if (keys.escape) {
      toggleSettings();
    }
  }, [keys.escape, toggleSettings]);
  const { locale, setLocale, t } = useI18n();

  const accessories: Exclude<AccessoryType, null>[] = ['hat-pokemon', 'hat-crisis'];

  const accessoryIcons: Record<Exclude<AccessoryType, null>, string> = {
    'hat-pokemon': '⚡️',
    'hat-crisis': '🤔',
  };

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closeSettings}
    >
      {/* Settings panel */}
      <div
        className="bg-tunic-beige rounded-lg shadow-xl p-6 w-80 border-2 border-tunic-steel max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-tunic-steel mb-4">
          {t('settings.title') || 'Settings'}
        </h3>

        {/* Ambient Music toggle */}
        <div className="mb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="text-tunic-steel font-medium">
              {t('settings.ambientMusic') || 'Ambient Music'}
            </span>
            <button
              onClick={() =>
                setAmbientMusic(
                  ambientMusicEnabled && !ambientMusicPlaying ? true : !ambientMusicEnabled
                )
              }
              className={`p-2 rounded transition-colors ${
                ambientMusicPlaying
                  ? 'bg-tunic-green hover:bg-tunic-dark-green text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
              }`}
              aria-label={ambientMusicEnabled ? 'Disable ambient music' : 'Enable ambient music'}
            >
              {ambientMusicPlaying ? (
                <Volume2 size={20} style={{ pointerEvents: 'none' }} />
              ) : (
                <VolumeX size={20} style={{ pointerEvents: 'none' }} />
              )}
            </button>
          </label>

          {/* Ambient Music volume slider */}
          {ambientMusicEnabled && ambientMusicPlaying && (
            <div className="mt-2">
              <label htmlFor="ambientVolume" className="text-sm text-tunic-steel block mb-1">
                {t('settings.volume') || 'Volume'}: {Math.round(ambientMusicVolume * 100)}%
              </label>
              <input
                id="ambientVolume"
                type="range"
                min="0"
                max="100"
                value={ambientMusicVolume * 100}
                onChange={(e) => setAmbientMusicVolume(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tunic-green"
              />
            </div>
          )}
        </div>

        {/* Sound Effects toggle */}
        <div className="mb-4">
          <label className="flex items-center justify-between mb-2">
            <span className="text-tunic-steel font-medium">
              {t('settings.sound') || 'Sound effects'}
            </span>
            <button
              onClick={toggleSound}
              className={`p-2 rounded transition-colors ${
                soundEnabled
                  ? 'bg-tunic-green hover:bg-tunic-dark-green text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
              }`}
              aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? (
                <Volume2 size={20} style={{ pointerEvents: 'none' }} />
              ) : (
                <VolumeX size={20} style={{ pointerEvents: 'none' }} />
              )}
            </button>
          </label>

          {/* Sound Effects volume slider */}
          {soundEnabled && (
            <div className="mt-2">
              <label htmlFor="volume" className="text-sm text-tunic-steel block mb-1">
                {t('settings.volume') || 'Volume'}: {Math.round(volume * 100)}%
              </label>
              <input
                id="volume"
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tunic-green"
              />
            </div>
          )}
        </div>

        {/* Language Selection */}
        <div className="mb-4">
          <label className="text-tunic-steel font-medium block mb-2 flex items-center gap-2">
            <Globe size={16} />
            {t('settings.language')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocale('fr');
                setKeyboardLayout('azerty');
              }}
              className={`flex-1 px-3 py-2 rounded transition-all ${
                locale === 'fr'
                  ? 'bg-tunic-steel text-white shadow-md'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => {
                setLocale('en');
                setKeyboardLayout('qwerty');
              }}
              className={`flex-1 px-3 py-2 rounded transition-all ${
                locale === 'en'
                  ? 'bg-tunic-steel text-white shadow-md'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Keyboard Layout */}
        <div className="mb-4">
          <label className="text-tunic-steel font-medium block mb-2">
            {t('settings.keyboardLayout') || 'Keyboard Layout'}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setKeyboardLayout('azerty')}
              className={`flex-1 px-3 py-2 rounded transition-all ${
                keyboardLayout === 'azerty'
                  ? 'bg-tunic-steel text-white shadow-md'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              AZERTY
            </button>
            <button
              onClick={() => setKeyboardLayout('qwerty')}
              className={`flex-1 px-3 py-2 rounded transition-all ${
                keyboardLayout === 'qwerty'
                  ? 'bg-tunic-steel text-white shadow-md'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              QWERTY
            </button>
          </div>
        </div>

        {/* Accessories Selection */}
        <div className="mb-4">
          <label className="text-tunic-steel font-medium block mb-2">
            {t('settings.accessories') || 'Crab Accessories'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* No accessory option */}
            <button
              onClick={() => equipAccessory(null)}
              className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center text-2xl ${
                equippedAccessory === null
                  ? 'border-tunic-green bg-tunic-green/20'
                  : 'border-gray-300 hover:border-tunic-steel bg-gray-100'
              }`}
              title="Aucun accessoire"
              aria-label="Enlever l'accessoire"
            >
              ❌
            </button>

            {/* Accessory options */}
            {accessories.map((accessory) => {
              const isUnlocked = isAccessoryUnlocked(accessory);
              const isEquipped = equippedAccessory === accessory;
              const progress = getUnlockProgress(accessory);

              return (
                <button
                  key={accessory}
                  onClick={() => isUnlocked && equipAccessory(accessory)}
                  disabled={!isUnlocked}
                  className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center relative ${
                    isEquipped
                      ? 'border-tunic-green bg-tunic-green/20'
                      : isUnlocked
                        ? 'border-gray-300 hover:border-tunic-steel bg-gray-100'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    UNLOCK_CONDITIONS[accessory].description
                      ? t(UNLOCK_CONDITIONS[accessory].description)
                      : ''
                  }
                  aria-label={`Équiper ${accessory}`}
                >
                  <span className="text-2xl">{accessoryIcons[accessory]}</span>
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <span className="text-white text-xs font-bold">🔒</span>
                    </div>
                  )}
                  {!isUnlocked && progress.percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 rounded-b-lg overflow-hidden">
                      <div
                        className="h-full bg-tunic-green transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Show Controls button */}
        <button
          onClick={() => {
            useStore.getState().showControls();
            closeSettings();
          }}
          className="w-full bg-tunic-green hover:bg-tunic-dark-green text-white py-2 rounded transition-colors mb-2"
          aria-label="Afficher les contrôles"
        >
          📋 {t('settings.showControls')}
        </button>

        {/* Close button */}
        <button
          onClick={closeSettings}
          className="w-full bg-tunic-steel hover:bg-tunic-dark-steel text-white py-2 rounded transition-colors"
          aria-label={t('common.close')}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
