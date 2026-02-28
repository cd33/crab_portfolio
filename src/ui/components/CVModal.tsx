import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store/useStore';
import { useFocusTrap } from '@hooks/useFocusTrap';
import { Download, X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * CVModal - Beautiful modal to display and download CV
 */
export function CVModal() {
  const { t, locale } = useI18n();
  const { isCVModalOpen, closeCVModal } = useStore();
  const containerRef = useFocusTrap(isCVModalOpen);
  const cvTitle =
    locale === 'fr' ? '/cv_charles_rosier_diallo.pdf' : '/cv_charles_rosier_diallo_english.pdf';

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCVModalOpen) {
        closeCVModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCVModalOpen, closeCVModal]);

  if (!isCVModalOpen) return null;

  const handleDownload = () => {
    const file = cvTitle;
    const filename = cvTitle.split('/').pop() || 'cv_charles_rosier_diallo.pdf';
    const link = document.createElement('a');
    link.href = file;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-500/30 m-4 animate-fadeInSlide"
      >
        {/* CV Viewer */}
        <div className="p-3 pt-2 md:p-6 md:pt-2 overflow-y-auto max-h-[calc(90vh)] bg-gray-900/50">
          <div className="flex justify-end mb-2">
            <button
              onClick={closeCVModal}
              className="p-2 bg-white/10 hover:bg-white/40 rounded-full transition-all duration-200 transform hover:scale-110"
              aria-label={t('common.close')}
            >
              <X className="w-7 h-7 text-white" />
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-700">
            <iframe
              src={
                locale === 'fr'
                  ? '/cv_charles_rosier_diallo.pdf'
                  : '/cv_charles_rosier_diallo_english.pdf'
              }
              className="w-full h-[55vh] md:h-[600px] border-0"
              title={t('cv.title')}
            />
          </div>
        </div>

        {/* Footer with download button */}
        <div className="p-3 md:p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-t-2 border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4">
          <button
            onClick={handleDownload}
            className="group relative w-full sm:w-auto px-5 py-3 md:px-8 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5 md:w-6 md:h-6 animate-bounce group-hover:animate-none" />
            <span className="text-base md:text-lg">{t('cv.download')}</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <a
            href="https://www.linkedin.com/in/charles-diallo/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto px-5 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-3"
            aria-label={t('cv.linkedin')}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 group-hover:text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.026-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.6 2.001 3.6 4.601v5.595z" />
            </svg>
            <span className="text-base md:text-lg group-hover:text-white">{t('cv.linkedin')}</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
          <a
            href="https://github.com/cd33"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto px-5 py-3 md:px-8 md:py-4 bg-gradient-to-r from-gray-900 to-purple-900 hover:from-gray-800 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-3"
            aria-label={t('cv.github')}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 group-hover:text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="text-base md:text-lg group-hover:text-white">{t('cv.github')}</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>
      </div>
    </div>
  );
}
