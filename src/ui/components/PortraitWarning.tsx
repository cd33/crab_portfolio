import { useI18n } from '@/hooks/useI18n';
import { useEffect, useState } from 'react';

/**
 * PortraitWarning - Overlay shown on very small portrait screens (< 400 px wide).
 * Advises the user to rotate their device for a better experience.
 * Dismissible by tapping anywhere on the overlay.
 */
export function PortraitWarning() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isTooNarrow = window.innerWidth < 400;
      setVisible(isPortrait && isTooNarrow);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 px-8 text-center"
      role="alert"
      aria-live="assertive"
      onClick={() => setVisible(false)}
    >
      {/* Rotation icon */}
      <svg
        className="mb-6 text-tunic-sand animate-bounce"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        {/* Rotation arrow */}
        <path d="M7 7 A7 7 0 0 1 17 7" />
        <polyline points="17 4 17 7 14 7" />
      </svg>

      <p className="text-white text-xl font-bold mb-3">{t('portrait.title')}</p>
      <p className="text-gray-300 text-sm leading-relaxed">{t('portrait.message')}</p>

      <button
        className="mt-8 px-6 py-2 rounded-full bg-tunic-sand/20 border border-tunic-sand/40 text-tunic-sand text-sm"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        type="button"
      >
        {t('portrait.dismiss')}
      </button>
    </div>
  );
}
