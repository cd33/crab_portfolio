import { useI18n } from '@/hooks/useI18n';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useStore } from '@/store/useStore';
import { INTERACTIVES_OBJECTS } from '@/utils/constants';
import { useFocusTrap } from '@hooks/useFocusTrap';
import { Check, Download, Mail, MapIcon, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

/**
 * Progress Map - Shows discovery progress of interactive objects
 *
 * Displays a mini-map with all interactive objects and their discovery status.
 * Shows congratulations message when 100% complete with CV and contact buttons.
 */
export function ProgressMap() {
  const keys = useKeyboard();
  const { t, locale } = useI18n();
  const { isDiscovered } = useStore();
  const containerRef = useFocusTrap(true);
  const { isProgressMapOpen, toggleProgressMap } = useStore();

  const cvTitle =
    locale === 'fr' ? '/cv_charles_rosier_diallo.pdf' : '/cv_charles_rosier_diallo_english.pdf';

  useEffect(() => {
    if (keys.map) {
      toggleProgressMap();
    }
  }, [keys.map, toggleProgressMap]);

  // All interactive objects in the scene
  const allObjects = useMemo(() => {
    return INTERACTIVES_OBJECTS.map((obj) => ({
      id: obj.id,
      name: t(obj.nameKey),
      icon: obj.icon,
    }));
  }, [t]);

  // Calculate progress
  const discoveredCount = allObjects.filter((obj) => isDiscovered(obj.id)).length;
  const totalCount = allObjects.length;
  const completionPercentage = Math.round((discoveredCount / totalCount) * 100);
  const isComplete = completionPercentage === 100;

  if (!isProgressMapOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-map-title"
      aria-describedby="progress-map-description"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl rounded-lg bg-tunic-beige p-6 shadow-2xl animate-fadeInSlide"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-tunic-steel/20 pb-4">
          <div className="flex items-center gap-3">
            <MapIcon className="h-6 w-6 text-tunic-steel" />
            <h2 id="progress-map-title" className="text-2xl font-bold text-tunic-steel">
              {t('progress.title')}
            </h2>
          </div>
          <button
            onClick={toggleProgressMap}
            className="rounded-full p-2 text-tunic-steel transition-colors hover:bg-tunic-steel/10"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Counter */}
        <div id="progress-map-description" className="mb-6 text-center">
          <p className="text-lg font-semibold text-tunic-steel">
            {t('progress.total', {
              current: discoveredCount.toString(),
              total: totalCount.toString(),
            })}
          </p>
          <div className="mx-auto mt-2 h-3 w-full max-w-md overflow-hidden rounded-full bg-tunic-steel/20">
            <div
              className="h-full bg-tunic-green transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-tunic-steel/70">
            {t('progress.percentage', { percent: completionPercentage.toString() })}
          </p>
        </div>

        {/* Objects Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {allObjects.map((obj) => {
            const discovered = isDiscovered(obj.id);
            return (
              <div
                key={obj.id}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  discovered
                    ? 'border-tunic-green bg-tunic-green/10'
                    : 'border-tunic-steel/30 bg-tunic-steel/5'
                }`}
              >
                <span className="text-4xl">{obj.icon}</span>
                <p className="text-center text-sm font-medium text-tunic-steel">{obj.name}</p>
                {discovered && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-tunic-green">
                    <Check className="h-4 w-4" />
                    <span>{t('interactions.discovered')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Congratulations Section (100% complete) */}
        {isComplete && (
          <div className="rounded-lg border-2 border-tunic-green bg-tunic-green/10 p-6 text-center">
            <h3 className="mb-2 text-2xl font-bold text-tunic-green">
              🎉 {t('progress.congratulations')}
            </h3>
            <p className="mb-4 text-tunic-steel">{t('progress.allDiscovered')}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={cvTitle}
                download={cvTitle.split('/').pop()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-tunic-steel px-6 py-3 font-semibold text-white transition-transform hover:scale-105 hover:bg-tunic-steel/90"
              >
                <Download className="h-5 w-5" />
                {t('progress.downloadCV')}
              </a>
              <a
                href="mailto:charlesdiallo@hotmail.fr"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-tunic-steel bg-transparent px-6 py-3 font-semibold text-tunic-steel transition-transform hover:scale-105 hover:bg-tunic-steel/10"
              >
                <Mail className="h-5 w-5" />
                {t('progress.contact')}
              </a>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!isComplete && (
          <p className="mt-4 text-center text-sm text-tunic-steel/60">{t('scene.explore')}</p>
        )}
      </div>
    </div>
  );
}
