import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store/useStore';
import { useFocusTrap } from '@hooks/useFocusTrap';
import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * InfoPanel - Modal displaying project or info content
 */
export function InfoPanel() {
  const { t } = useI18n();
  const { isPanelOpen, panelContent, closePanel } = useStore();
  const containerRef = useFocusTrap(isPanelOpen);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen || !panelContent) return null;

  const closeButton = (
    <button
      onClick={closePanel}
      className="absolute top-4 right-4 p-2 text-gray-800 hover:text-white hover:bg-gray-800 rounded-full transition-colors z-10"
      aria-label={t('common.close')}
    >
      <X className="w-6 h-6" />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-panel-title"
      aria-describedby="info-panel-description"
    >
      {panelContent.type && panelContent.type === 'image' && panelContent.title ? (
        panelContent.description ? (
          <div
            ref={containerRef}
            className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900/95 rounded-lg shadow-2xl overflow-hidden border border-gray-700 m-4 animate-fadeInSlide flex flex-col"
          >
            {closeButton}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center">
              <img
                src={panelContent.title}
                alt={panelContent.title}
                className="max-w-full max-h-full object-contain mb-4"
              />
              {panelContent.description && (
                <p className="text-white text-xl text-center whitespace-pre-line">
                  {t(panelContent.description)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {closeButton}
            <img src={panelContent.title} alt={panelContent.title} />
          </>
        )
      ) : (
        <div
          ref={containerRef}
          className="relative max-w-2xl w-full max-h-[80vh] bg-gray-900/95 rounded-lg shadow-2xl overflow-hidden border border-gray-700 m-4 animate-fadeInSlide"
        >
          {closeButton}

          <div className="p-8 overflow-y-auto max-h-[80vh]">
            {/* Title */}
            {panelContent?.title && (
              <h2 id="info-panel-title" className="text-3xl font-bold text-white mb-4">
                {t(panelContent.title)}
              </h2>
            )}

            {/* Description */}
            {panelContent?.description && (
              <p id="info-panel-description" className="text-gray-300 text-lg mb-6 leading-relaxed">
                {t(panelContent.description)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
