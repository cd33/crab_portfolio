import { useSound } from '@/hooks/useSound';
import { useStore } from '@/store/useStore';
import { useFocusTrap } from '@hooks/useFocusTrap';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const LEET = '*1337*';
const keypadButtons = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '*'];

/**
 * SecurityKeypadModal - Interactive keypad to enter a code
 * Visual style inspired by the wall mesh
 */
export function SecurityKeypadModal() {
  const { soundEnabled, volume, isSecurityKeypadOpen, closeSecurityKeypad, unlockDoor } =
    useStore();
  const containerRef = useFocusTrap(isSecurityKeypadOpen);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const doorSound = useSound('/sounds/door-opening.mp3', {
    volume: volume * 1,
    enabled: soundEnabled,
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSecurityKeypadOpen) {
        closeSecurityKeypad();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSecurityKeypadOpen, closeSecurityKeypad]);

  if (!isSecurityKeypadOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (code.length < 6 && !isSuccess) {
      const newCode = code + digit;
      setCode(newCode);

      // Vérifier le code une fois qu'on a 6 chiffres
      if (newCode.length === 6) {
        if (newCode === LEET) {
          setFeedback('✓ ACCESS GRANTED');
          setIsSuccess(true);
          doorSound.play();
          unlockDoor();
          setTimeout(() => {
            closeSecurityKeypad();
          }, 1500);
        } else {
          setFeedback('✗ ACCESS DENIED');
          setTimeout(() => {
            setCode('');
            setFeedback('');
          }, 1500);
        }
      }
    }
  };

  const handleClear = () => {
    setCode('');
    setFeedback('');
    setIsSuccess(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keypad-modal-title"
    >
      <div
        ref={containerRef}
        className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4"
        style={{
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={closeSecurityKeypad}
          className="absolute top-4 right-4 p-2 text-gray-800 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all"
          aria-label="Close keypad"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2
          id="keypad-modal-title"
          className="text-2xl font-bold text-white mb-6 text-center tracking-wider"
          style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
        >
          SECURITY KEYPAD
        </h2>

        {/* Code display */}
        <div className="bg-slate-900/80 rounded-lg p-4 mb-6 border-2 border-slate-500">
          <div className="flex justify-center items-center gap-3 mb-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-12 h-14 bg-black/60 border-2 border-slate-600 rounded flex items-center justify-center text-2xl font-mono text-green-400"
                style={{ textShadow: '0 0 8px rgba(74, 222, 128, 0.8)' }}
              >
                {code[i] || ''}
              </div>
            ))}
          </div>
          {feedback && (
            <div
              className={`text-center text-sm font-bold tracking-wide ${
                isSuccess ? 'text-green-400' : 'text-red-400'
              }`}
              style={{
                textShadow: isSuccess
                  ? '0 0 8px rgba(74, 222, 128, 0.8)'
                  : '0 0 8px rgba(248, 113, 113, 0.8)',
              }}
            >
              {feedback}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {keypadButtons.map((digit) => (
            <button
              key={digit}
              onClick={() => (digit === 'C' ? handleClear() : handleKeyPress(digit))}
              disabled={isSuccess}
              className={`${
                digit === 'C'
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 active:from-orange-800 active:to-orange-900'
                  : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 active:from-slate-800 active:to-slate-900'
              } disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl py-4 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95`}
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
              }}
            >
              {digit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
