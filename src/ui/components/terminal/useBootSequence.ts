import { useEffect, useState } from 'react';

/**
 * Hook managing the terminal boot animation sequence.
 * Returns { isBooting, bootLines } - once boot completes, isBooting becomes false.
 */
export function useBootSequence(
  isOpen: boolean,
  t: (key: string) => string
): { isBooting: boolean; bootLines: string[] } {
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setIsBooting(true);
    setBootLines([]);

    const bootSequence = [
      t('terminal.bootSequence.systemBoot'),
      t('terminal.bootSequence.loadingKernel'),
      t('terminal.bootSequence.initMemory'),
      t('terminal.bootSequence.checkingCpu'),
      t('terminal.bootSequence.mountingFs'),
      t('terminal.bootSequence.startingNetwork'),
      t('terminal.bootSequence.loadingDrivers'),
      t('terminal.bootSequence.initTerminal'),
      '',
      t('terminal.bootSequence.version'),
      t('terminal.bootSequence.helpPrompt'),
      '',
    ];

    let currentLine = 0;

    const bootInterval = setInterval(() => {
      if (currentLine < bootSequence.length) {
        setBootLines((prev) => [...prev, bootSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(bootInterval);
        setTimeout(() => setIsBooting(false), 300);
      }
    }, 100);

    return () => clearInterval(bootInterval);
  }, [isOpen, t]);

  return { isBooting, bootLines };
}
