import { useI18n } from '@/hooks/useI18n';
import { useEffect } from 'react';
import './CheatDetectedModal.css';

export function CheatDetectedModal({ isOpen }: { isOpen: boolean }) {
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll
      document.body.style.overflow = 'hidden';

      // // Jouer un son d'erreur si possible
      // try {
      //   const audio = new Audio('/sounds/error.mp3');
      //   audio.volume = 0.5;
      //   audio.play().catch(() => {
      //     // Ignorer si le son ne peut pas être joué
      //   });
      // } catch {
      //   // Ignorer les erreurs audio
      // }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReload = () => {
    // // Nettoyer le localStorage avant de recharger
    // Object.keys(localStorage).forEach((key) => {
    //   if (key.includes('crab-portfolio') || key.includes('zustand')) {
    //     localStorage.removeItem(key);
    //   }
    // });
    window.location.reload();
  };

  return (
    <div className="cheat-detected-overlay">
      <div className="cheat-detected-modal">
        <div className="cheat-detected-header">
          <div className="cheat-detected-icon">🚨</div>
          <h1 className="cheat-detected-title">{t('cheatDetected.title')}</h1>
        </div>

        <div className="cheat-detected-content">
          <div className="cheat-detected-crab">
            <div className="sad-crab">🦀</div>
            <div className="broken-vacation">🏖️❌</div>
          </div>

          <p className="cheat-detected-message">{t('cheatDetected.message')}</p>

          <div className="cheat-detected-consequences">
            <h3>{t('cheatDetected.consequences')}</h3>
            <ul>
              <li>❌ {t('cheatDetected.noVacation')}</li>
              <li>🔒 {t('cheatDetected.gameOver')}</li>
              <li>😢 {t('cheatDetected.sadCrab')}</li>
            </ul>
          </div>

          <div className="cheat-detected-message-box">
            <p className="cheat-detected-quote">"{t('cheatDetected.crabQuote')}"</p>
            <p className="cheat-detected-signature">- {t('cheatDetected.crabSignature')}</p>
          </div>
        </div>

        <div className="cheat-detected-footer">
          <button onClick={handleReload} className="cheat-detected-button">
            {t('cheatDetected.restart')}
          </button>
          <p className="cheat-detected-note">{t('cheatDetected.note')}</p>
        </div>
      </div>
    </div>
  );
}
