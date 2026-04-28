import { useI18n } from '@/hooks/useI18n';
import { useSound } from '@/hooks/useSound';
import { useStore } from '@/store/useStore';
import { PASSWORD_HASHES, PASSWORDS_COUNT, verifyPassword } from '@/utils/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTableLine } from './terminal/formatTableLine';
import { TERMINAL_THEMES } from './terminal/terminalThemes';
import { useBootSequence } from './terminal/useBootSequence';
import { useMatrixRain } from './terminal/useMatrixRain';
import { usePongGame } from './terminal/usePongGame';
import { useSnakeGame } from './terminal/useSnakeGame';
import { listDirectory, resolveDirectory, resolveFile } from './terminal/virtualFilesystem';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
  };
}

interface TerminalLine {
  id: number;
  text: string;
  type: 'input' | 'output' | 'error';
}

/**
 * RetroTerminal - CRT-style terminal with retro aesthetics
 *
 * Features:
 * - Phosphor green glow effect
 * - Scanlines overlay
 * - CRT screen curvature simulation
 * - Monospace font (Courier New)
 * - Command history
 * - Fullscreen overlay
 */
export function RetroTerminal() {
  const {
    soundEnabled,
    volume,
    isTerminalOpen,
    closeTerminal,
    terminalTheme,
    setTerminalTheme,
    keyboardLayout,
    mugClickCount,
    mailCount,
    incrementMailCount,
    doorCount,
    incrementDoorCount,
    unlockAccessory,
    konamiActivated,
    setHackerActivated,
  } = useStore();
  const { t } = useI18n();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('/home/user');
  const [whoamiCount, setWhoamiCount] = useState(0);
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [currentGame, setCurrentGame] = useState<'snake' | 'pong' | 'doom' | null>(null);
  const [hackerModeActive, setHackerModeActive] = useState(false);
  const [commandAliases, setCommandAliases] = useState<Record<string, string>>({
    ll: 'ls',
    q: 'exit',
    cls: 'clear',
  });
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<string>('');
  const [caretPos, setCaretPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineIdCounter = useRef(3);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const logSound = useSound('/sounds/positive-notification.mp3', {
    volume: volume * 1,
    enabled: soundEnabled,
  });

  const currentTheme = TERMINAL_THEMES[terminalTheme];

  // --- Extracted hooks ---
  const { isBooting, bootLines } = useBootSequence(isTerminalOpen, t);

  useMatrixRain(matrixCanvasRef, hackerModeActive, terminalTheme);

  // Initialize terminal lines after boot
  useEffect(() => {
    if (!isBooting && isTerminalOpen) {
      // Deferred to avoid synchronous setState inside an effect body (react-hooks/set-state-in-effect)
      const id = setTimeout(() => {
        setLines([
          { id: 0, text: t('terminal.bootSequence.version'), type: 'output' },
          { id: 1, text: t('terminal.bootSequence.helpPrompt'), type: 'output' },
          { id: 2, text: '', type: 'output' },
        ]);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isBooting, isTerminalOpen, t]);

  // Auto-focus input when terminal opens
  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalOpen]);

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = useCallback((text: string, type: TerminalLine['type'] = 'output') => {
    setLines((prev) => [...prev, { id: lineIdCounter.current++, text, type }]);
  }, []);

  const toggleTheme = () => {
    setTerminalTheme(terminalTheme === 'green' ? 'amber' : 'green');
  };

  // --- Game callbacks ---
  const handleGameOver = useCallback(
    (message: string) => {
      setIsPlayingGame(false);
      setCurrentGame(null);
      addLine('', 'output');
      addLine(message, 'output');
      addLine('', 'output');
    },
    [addLine]
  );

  const handleSnakeGameOver = useCallback(
    (message: string, score: number) => {
      setIsPlayingGame(false);
      setCurrentGame(null);
      addLine('', 'output');
      addLine(message, 'error');
      addLine(`${t('terminal.games.snake.finalScore')} ${score}`, 'output');
      addLine('', 'output');
    },
    [addLine, t]
  );

  // Conditionally run game hooks
  useSnakeGame({
    canvasRef: isPlayingGame && currentGame === 'snake' ? gameCanvasRef : { current: null },
    theme: terminalTheme,
    keyboardLayout,
    t,
    onGameOver: handleSnakeGameOver,
  });

  usePongGame({
    canvasRef: isPlayingGame && currentGame === 'pong' ? gameCanvasRef : { current: null },
    theme: terminalTheme,
    keyboardLayout,
    onGameOver: handleGameOver,
  });

  // --- Command execution ---
  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();

    if (awaitingPassword) {
      addLine(`> ${cmd}`, 'input');
      if (trimmedCmd === 'admin') {
        const result = resolveFile(passwordTarget, t);
        if (result?.content) {
          result.content.split('\n').forEach((line) => addLine(line, 'output'));
        }
        addLine('', 'output');
      } else {
        addLine(t('terminal.errors.incorrectPassword'), 'error');
        addLine('', 'output');
      }
      setAwaitingPassword(false);
      setPasswordTarget('');
      setCurrentInput('');
      return;
    }

    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();

    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
    }

    addLine(`> ${cmd}`, 'input');

    const resolvedCmd = commandAliases[command] || command;

    switch (resolvedCmd) {
      case 'help':
        addLine('╔═════════════════════════════════════════════════╗', 'output');
        addLine(formatTableLine(`║ ${t('terminal.help.header')}`, 51, true), 'output');
        addLine('╚═════════════════════════════════════════════════╝', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.help.systemCommands')} ${'─'.repeat(Math.max(0, 46 - t('terminal.help.systemCommands').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ help: ${t('terminal.help.helpDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ clear: ${t('terminal.help.clearDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ exit/quit/q: ${t('terminal.help.exitDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ sysinfo: ${t('terminal.help.sysinfoDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ theme: ${t('terminal.help.themeDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ alias: ${t('terminal.help.aliasDesc')}`, 51), 'output');
        addLine('└─────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.help.fileSystem')} ${'─'.repeat(Math.max(0, 46 - t('terminal.help.fileSystem').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ ls: ${t('terminal.help.lsDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ cat <file>: ${t('terminal.help.catDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ cd <dir>: ${t('terminal.help.cdDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ pwd: ${t('terminal.help.pwdDesc')}`, 51), 'output');
        addLine('└─────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.help.specialCommands')} ${'─'.repeat(Math.max(0, 46 - t('terminal.help.specialCommands').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ logs: ${t('terminal.help.logsDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ profile: ${t('terminal.help.profileDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ whoami: ${t('terminal.help.whoamiDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ mail: ${t('terminal.help.mailDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ door: ${t('terminal.help.doorDesc')}`, 51), 'output');
        addLine('└─────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.help.miniGames')} ${'─'.repeat(Math.max(0, 46 - t('terminal.help.miniGames').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ games: ${t('terminal.help.gamesDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ snake: ${t('terminal.help.snakeDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ pong: ${t('terminal.help.pongDesc')}`, 51), 'output');
        addLine(formatTableLine(`│ doom: ${t('terminal.help.doomDesc')}`, 51), 'output');
        addLine('└─────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.help.advanced')} ${'─'.repeat(Math.max(0, 46 - t('terminal.help.advanced').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ ai_chat: ${t('terminal.help.aiChatDesc')}`, 51), 'output');
        addLine('└─────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        break;

      case 'pwd':
        addLine(currentDirectory, 'output');
        break;

      case 'ls': {
        const files = listDirectory(currentDirectory);
        if (files.length === 0) {
          addLine(t('terminal.errors.emptyDirectory'), 'output');
        } else {
          files.forEach((file) => {
            const name = file.substring(file.lastIndexOf('/') + 1);
            const result = resolveFile(file, t);
            const displayName = result?.type === 'dir' ? `${name}/` : name;
            addLine(displayName, 'output');
          });
        }
        break;
      }

      case 'cd': {
        if (parts.length < 2) {
          addLine(t('terminal.errors.usage', { usage: 'cd <directory>' }), 'error');
          break;
        }
        const newDir = resolveDirectory(currentDirectory, parts[1]);
        if (newDir) {
          setCurrentDirectory(newDir);
        } else {
          addLine(t('terminal.errors.dirNotFound', { dir: parts[1] }), 'error');
        }
        break;
      }

      case 'cat': {
        if (parts.length < 2) {
          addLine(t('terminal.errors.usage', { usage: 'cat <file>' }), 'error');
          break;
        }
        const fileName = parts[1];
        const requestedPath = fileName.startsWith('/')
          ? fileName
          : currentDirectory === '/'
            ? `/${fileName}`
            : `${currentDirectory}/${fileName}`;

        const file = resolveFile(requestedPath, t);
        if (!file) {
          addLine(t('terminal.errors.fileNotFound', { file: fileName }), 'error');
        } else if (file.type === 'dir') {
          addLine(`cat: ${fileName}: Is a directory`, 'error');
        } else {
          (file.content || '').split('\n').forEach((line) => addLine(line, 'output'));
        }
        break;
      }

      case 'clear':
        setLines([]);
        break;

      case 'exit':
      case 'quit':
        closeTerminal();
        break;

      case 'theme':
        toggleTheme();
        addLine(
          t('terminal.theme.label', {
            theme: terminalTheme === 'green' ? 'AMBER' : 'GREEN',
          }),
          'output'
        );
        break;

      case 'logs':
        addLine('═'.repeat(t('terminal.logs.title').length), 'output');
        addLine(t('terminal.logs.title'), 'output');
        addLine('═'.repeat(t('terminal.logs.title').length), 'output');
        addLine('', 'output');
        addLine('[LOG] - 15/01/2025', 'output');
        addLine(t('terminal.logs.log1'), 'output');
        addLine('', 'output');
        addLine('[LOG] - 20/02/2025', 'output');
        addLine(t('terminal.logs.log2'), 'output');
        addLine('', 'output');
        if (mugClickCount > 2) {
          addLine(`[LOG] - ${new Date().toLocaleDateString()}`, 'output');
          addLine(t('terminal.logs.log5'), 'output');
          addLine('', 'output');
        }
        if (konamiActivated) {
          addLine(`[LOG] - ${new Date().toLocaleDateString()}`, 'output');
          addLine(t('terminal.logs.log3'), 'output');
          addLine('', 'output');
        }
        if (doorCount >= PASSWORDS_COUNT) {
          addLine(`[LOG] - ${new Date().toLocaleDateString()}`, 'output');
          addLine(t('terminal.logs.log4'), 'output');
          addLine('', 'output');
        }
        break;

      case 'profile':
        addLine('╔════════════════════════════════════════════════╗', 'output');
        addLine(formatTableLine(t('terminal.profile.title'), 50, true), 'output');
        addLine('╚════════════════════════════════════════════════╝', 'output');
        addLine('', 'output');
        addLine(t('terminal.profile.name'), 'output');
        addLine(t('terminal.profile.species'), 'output');
        addLine(t('terminal.profile.occupation'), 'output');
        addLine(t('terminal.profile.level'), 'output');
        addLine('', 'output');
        addLine('┌─ SKILLS ───────────────────────────────────────┐', 'output');
        addLine(formatTableLine('│ Three.js ████████████ 95%'), 'output');
        addLine(formatTableLine('│ React/TypeScript ███████████░ 92%'), 'output');
        addLine(formatTableLine('│ Retro Aesthetics ██████████░░ 88%'), 'output');
        addLine(formatTableLine('│ Easter Egg Design ████████████ 100%'), 'output');
        addLine(formatTableLine('│ Claw Precision ███████░░░░░ 65%'), 'output');
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine('┌─ STATS ────────────────────────────────────────┐', 'output');
        addLine(formatTableLine('│ HP: ████████████████████ 100/100'), 'output');
        addLine(formatTableLine('│ MP: ████████████████░░░░ 80/100'), 'output');
        addLine(formatTableLine('│ XP: ███████████████████░ 950/1000'), 'output');
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(t('terminal.profile.bio'), 'output');
        addLine('', 'output');
        break;

      case 'sysinfo': {
        addLine('╔════════════════════════════════════════════════╗', 'output');
        addLine(formatTableLine('║ SYSTEM INFORMATION', 50, true), 'output');
        addLine('╚════════════════════════════════════════════════╝', 'output');
        addLine('', 'output');
        addLine('Operating System:  RetroOS v1.0 (CRT Edition)', 'output');
        addLine('Kernel Version:    5.15.0-retro-crab', 'output');
        addLine('Architecture:      x86_64 (64-bit)', 'output');
        addLine('Hostname:          crab-terminal-001', 'output');
        addLine('', 'output');
        addLine('┌─ BROWSER INFO ─────────────────────────────────┐', 'output');
        addLine(formatTableLine(`│ User Agent: ${navigator.userAgent.substring(0, 35)}`), 'output');
        addLine(formatTableLine(`│ ${navigator.userAgent.substring(35, 80)}`), 'output');
        if (navigator.userAgent.length > 80) {
          addLine(formatTableLine(`│ ${navigator.userAgent.substring(80, 120)}`), 'output');
        }
        addLine(formatTableLine(`│ Platform: ${navigator.platform}`), 'output');
        addLine(formatTableLine(`│ Language: ${navigator.language}`), 'output');
        addLine(
          formatTableLine(`│ Cookies: ${navigator.cookieEnabled ? 'Enabled' : 'Disabled'}`),
          'output'
        );
        addLine(formatTableLine(`│ Online: ${navigator.onLine ? 'Yes' : 'No'}`), 'output');
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine('┌─ SCREEN ───────────────────────────────────────┐', 'output');
        addLine(
          formatTableLine(`│ Resolution: ${window.screen.width}x${window.screen.height}`),
          'output'
        );
        addLine(
          formatTableLine(`│ Available: ${window.screen.availWidth}x${window.screen.availHeight}`),
          'output'
        );
        addLine(formatTableLine(`│ Color Depth: ${window.screen.colorDepth}-bit`), 'output');
        addLine(formatTableLine(`│ Pixel Ratio: ${window.devicePixelRatio}x`), 'output');
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine('┌─ MEMORY (Estimated) ───────────────────────────┐', 'output');
        if ('deviceMemory' in navigator) {
          addLine(
            formatTableLine(
              `│ Device Memory: ${(navigator as NavigatorWithMemory).deviceMemory} GB`
            ),
            'output'
          );
        } else {
          addLine(formatTableLine(`│ Device Memory: N/A (not supported)`), 'output');
        }
        if ('hardwareConcurrency' in navigator) {
          addLine(formatTableLine(`│ CPU Cores: ${navigator.hardwareConcurrency}`), 'output');
        }
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine('┌─ NETWORK ──────────────────────────────────────┐', 'output');
        if ('connection' in navigator) {
          const conn = (navigator as NavigatorWithMemory).connection;
          addLine(formatTableLine(`│ Type: ${conn?.effectiveType || 'unknown'}`), 'output');
          addLine(
            formatTableLine(`│ Downlink: ${conn?.downlink ? conn.downlink + ' Mbps' : 'N/A'}`),
            'output'
          );
        } else {
          addLine(formatTableLine('│ Connection info not available'), 'output');
        }
        addLine(
          formatTableLine(`│ Status: ${navigator.onLine ? 'Connected' : 'Offline'}`),
          'output'
        );
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(`Current Time: ${new Date().toLocaleString()}`, 'output');
        addLine('', 'output');
        break;
      }

      case 'whoami': {
        const newCount = whoamiCount + 1;
        setWhoamiCount(newCount);

        if (newCount === 2) addLine(t('terminal.whoami.second'), 'output');
        else if (newCount === 3) addLine(t('terminal.whoami.third'), 'output');
        else if (newCount === 4) addLine(t('terminal.whoami.fourth'), 'output');
        else if (newCount >= 5) {
          unlockAccessory('hat-crisis');
          addLine('╔════════════════════════════════════════════════╗', 'output');
          addLine(formatTableLine(`║ ${t('terminal.whoami.idCrisis')}`, 50, true), 'output');
          addLine('╚════════════════════════════════════════════════╝', 'output');
          addLine('', 'output');
          addLine(t('terminal.whoami.hatOffer'), 'output');
          addLine('', 'output');
        }
        addLine('user@crab-terminal-001', 'output');
        break;
      }

      case 'shutdown':
        addLine('', 'output');
        addLine('╔════════════════════════════════════════════════╗', 'output');
        addLine(formatTableLine(`║ ${t('terminal.shutdown.systemShutdown')}`, 50, true), 'output');
        addLine('╚════════════════════════════════════════════════╝', 'output');
        addLine('', 'output');
        addLine(t('terminal.shutdown.savingSession'), 'output');
        addLine(t('terminal.shutdown.closingApps'), 'output');
        addLine('', 'output');
        setTimeout(() => closeTerminal(), 1500);
        break;

      case 'games':
        addLine('╔════════════════════════════════════════════════╗', 'output');
        addLine(formatTableLine(`║ ${t('terminal.games.available')}`, 50, true), 'output');
        addLine('╚════════════════════════════════════════════════╝', 'output');
        addLine('', 'output');
        addLine(
          `┌─ ${t('terminal.games.classicArcade')} ${'─'.repeat(Math.max(0, 45 - t('terminal.games.classicArcade').length))}┐`,
          'output'
        );
        addLine(formatTableLine(`│ ${t('terminal.games.snake.title')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.snake.desc')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.status')}`), 'output');
        addLine(formatTableLine('│'), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.pong.title')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.pong.desc')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.status')}`), 'output');
        addLine(formatTableLine('│'), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.doom.title')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.doom.desc')}`), 'output');
        addLine(formatTableLine(`│ ${t('terminal.games.status')}`), 'output');
        addLine('└────────────────────────────────────────────────┘', 'output');
        addLine('', 'output');
        addLine(t('terminal.games.instruction'), 'output');
        addLine('', 'output');
        break;

      case 'mail': {
        const currentDate = new Date().toLocaleDateString();
        const borderTop =
          '╔══════════════════════════════════════════════════════════════════════════════╗';
        const borderBottom =
          '╚══════════════════════════════════════════════════════════════════════════════╝';
        const mailBoxTop =
          '┌──────────────────────────────────────────────────────────────────────────────┐';
        const mailBoxBottom =
          '└──────────────────────────────────────────────────────────────────────────────┘';
        addLine(borderTop, 'output');
        addLine(formatTableLine(`║ ${t('terminal.mails.client')}`, 80, true), 'output');
        addLine(borderBottom, 'output');
        addLine('', 'output');
        addLine(t('terminal.mails.inbox', { messagesLength: mailCount }), 'output');
        addLine('', 'output');

        for (let mailId = mailCount; mailId >= 1; mailId--) {
          const mailKey = `terminal.mails.mail${mailId}`;
          const mailContent = t(mailKey, { date: currentDate });
          if (typeof mailContent === 'string') {
            const mailLines = mailContent.split('\n');
            addLine(mailBoxTop, 'output');
            mailLines.forEach((line) => {
              addLine(formatTableLine(`│ ${line}`, 80), 'output');
            });
            addLine(mailBoxBottom, 'output');
            addLine('', 'output');
          }
        }
        break;
      }

      case 'door': {
        if (doorCount >= PASSWORDS_COUNT) {
          addLine(t('terminal.door.statusComplete'), 'output');
          addLine(t('terminal.door.alreadyUnlocked'), 'output');
          break;
        }

        if (parts.length === 1) {
          if (doorCount === 0) {
            addLine(t('terminal.door.statusLocked'), 'output');
          } else {
            addLine(
              t('terminal.door.statusPartial', { stage: doorCount, total: PASSWORDS_COUNT }),
              'output'
            );
          }
          addLine(t('terminal.door.enterPassword'), 'output');
        } else {
          const input = parts[1];
          (async () => {
            const isCorrect = await verifyPassword(input, PASSWORD_HASHES[doorCount]);
            if (isCorrect) {
              incrementDoorCount();
              incrementMailCount();
              if (mailCount === 2) {
                incrementMailCount();
              } else if (doorCount === 4) {
                logSound.play();
              }
              addLine(t('terminal.door.newMailNotification'), 'output');
              addLine(
                t('terminal.door.stageComplete', {
                  stage: doorCount + 1,
                  total: PASSWORDS_COUNT,
                }),
                'output'
              );
              if (doorCount + 1 < PASSWORDS_COUNT) {
                addLine(t('terminal.door.awaitingNext'), 'output');
                addLine(t('terminal.door.enterPassword'), 'output');
                if (doorCount === 3) {
                  console.log('Presque, mais pas tout à fait...');
                  localStorage.setItem('crab_context', '50_m374');
                }
              } else {
                addLine(t('terminal.door.statusComplete'), 'output');
                addLine(t('terminal.door.unlocked'), 'output');
              }
            } else {
              addLine(t('terminal.door.incorrectPassword'), 'error');
              addLine(
                doorCount === 0
                  ? t('terminal.door.statusLocked')
                  : t('terminal.door.statusPartial', {
                      stage: doorCount,
                      total: PASSWORDS_COUNT,
                    }),
                'output'
              );
              addLine(t('terminal.door.tryAgain'), 'output');
            }
          })();
        }
        break;
      }

      case '':
        break;

      case 'ai_chat':
      case 'run ai_chat': {
        const intro = [
          { text: '╔════════════════════════════════════════════════╗', type: 'output' as const },
          {
            text: formatTableLine('║ RETRO AI ASSISTANT v0.9β', 50, true),
            type: 'output' as const,
          },
          { text: '╚════════════════════════════════════════════════╝', type: 'output' as const },
          { text: '', type: 'output' as const },
        ];
        const aiLines = [
          { text: t('terminal.ai_chat.greeting'), type: 'output' as const },
          { text: '', type: 'output' as const },
          { text: t('terminal.ai_chat.explore'), type: 'output' as const },
          { text: t('terminal.ai_chat.sarcasticRemark'), type: 'output' as const },
          { text: '', type: 'output' as const },
          { text: t('terminal.ai_chat.difficulty'), type: 'output' as const },
          { text: t('terminal.ai_chat.hackerJoke'), type: 'output' as const },
          { text: '', type: 'output' as const },
          {
            text: 'Something went wrong... if the problem persists please try again later',
            type: 'error' as const,
          },
          { text: '', type: 'output' as const },
        ];
        (async () => {
          intro.forEach((line) => addLine(line.text, line.type));
          for (let i = 0; i < aiLines.length; i++) {
            await new Promise((res) => setTimeout(res, i === aiLines.length - 2 ? 1200 : 600));
            addLine(aiLines[i].text, aiLines[i].type);
          }
        })();
        break;
      }

      case 'alias': {
        if (parts.length === 1) {
          addLine(t('terminal.alias.current'), 'output');
          Object.entries(commandAliases).forEach(([alias, cmd]) => {
            addLine(`  ${alias} → ${cmd}`, 'output');
          });
          addLine('', 'output');
          addLine('Usage: alias <name>=<command>', 'output');
        } else if (parts[1].includes('=')) {
          const [alias, cmd] = parts[1].split('=');
          setCommandAliases((prev) => ({ ...prev, [alias]: cmd }));
          addLine(`${t('terminal.alias.created')} ${alias} → ${cmd}`, 'output');
        } else {
          addLine('Usage: alias <name>=<command>', 'error');
        }
        break;
      }

      case 'hacker':
        setHackerActivated();
        setHackerModeActive(!hackerModeActive);
        if (!hackerModeActive) {
          addLine('', 'output');
          addLine('╔════════════════════════════════════════════════╗', 'output');
          addLine(formatTableLine('║ H4CK3R M0D3 4CT1V4T3D', 50, true), 'output');
          addLine('╚════════════════════════════════════════════════╝', 'output');
          addLine('', 'output');
          addLine('1NP1T M4TR1X R41N 3FF3CT...', 'output');
          addLine('', 'output');
          addLine('01001000 01100001 01100011 01101011', 'output');
          addLine('01110100 01101000 01100101 01110000', 'output');
          addLine('01101100 01100001 01101110 01100101', 'output');
          addLine('01110100', 'output');
          addLine('', 'output');
          addLine('⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿', 'output');
          addLine('⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿', 'output');
          addLine('⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠛⠋⠉⠉⠉⠉⠉⠉⠙⠛⠿⢿⣿⣿', 'output');
          addLine('', 'output');
          addLine('W3LC0M3 T0 TH3 M4TR1X, N30...', 'output');
          addLine('', 'output');
          addLine('Type "hacker" again to disable.', 'output');
          addLine('', 'output');
        } else {
          addLine('', 'output');
          addLine('Hack done.', 'output');
          addLine('', 'output');
        }
        break;

      case 'snake':
        setIsPlayingGame(true);
        setCurrentGame('snake');
        break;

      case 'pong':
        setIsPlayingGame(true);
        setCurrentGame('pong');
        break;

      case 'doom':
        setIsPlayingGame(true);
        setCurrentGame('doom');
        break;

      default:
        addLine(t('terminal.errors.commandNotFound', { command }), 'error');
        addLine(t('terminal.errors.help'), 'output');
    }

    setCurrentInput('');
    setHistoryIndex(-1);
  };

  // --- Input handling ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const input = currentInput.trim();
      if (!input) return;

      const allCommands = [
        'help',
        'clear',
        'exit',
        'quit',
        'sysinfo',
        'theme',
        'ls',
        'cat',
        'cd',
        'pwd',
        'logs',
        'profile',
        'whoami',
        'mail',
        'door',
        'games',
        'snake',
        'pong',
        'doom',
        'ai_chat',
        'hacker',
        'alias',
        'shutdown',
      ];

      const cmdParts = input.split(' ');
      const commandPart = cmdParts[0].toLowerCase();

      if (cmdParts.length === 1) {
        const matches = allCommands.filter((cmd) => cmd.startsWith(commandPart));
        if (matches.length === 1) {
          setCurrentInput(matches[0]);
        } else if (matches.length > 1) {
          addLine(`> ${input}`, 'input');
          addLine(matches.join('  '), 'output');
        }
      } else if (commandPart === 'cat' || commandPart === 'cd') {
        const prefix = cmdParts[1] || '';
        const files = listDirectory(currentDirectory);
        const fileNames = files.map((f) => f.substring(f.lastIndexOf('/') + 1));
        const matches = fileNames.filter((name) =>
          name.toLowerCase().startsWith(prefix.toLowerCase())
        );

        if (matches.length === 1) {
          setCurrentInput(`${commandPart} ${matches[0]}`);
        } else if (matches.length > 1) {
          addLine(`> ${input}`, 'input');
          addLine(matches.join('  '), 'output');
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Escape') {
      closeTerminal();
    }
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Terminal"
    >
      {/* CRT Screen Container */}
      <div className="relative w-full h-full max-w-7xl max-h-screen p-0 sm:p-8">
        {/* CRT Bezel Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl" />

        {/* Screen */}
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-inner">
          {/* Scanlines Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, ${currentTheme.scanlines} 0px, ${currentTheme.scanlines} 1px, transparent 1px, transparent 2px)`,
            }}
          />

          {/* Phosphor Glow Effect */}
          <div className={`absolute inset-0 ${currentTheme.bgOverlay} pointer-events-none z-10`} />

          {/* Hacker Mode Matrix Effect */}
          {hackerModeActive && (
            <canvas
              ref={matrixCanvasRef}
              className="absolute inset-0 pointer-events-none z-20"
              style={{ opacity: 0.6 }}
            />
          )}

          {/* Terminal Content */}
          {isPlayingGame && currentGame === 'doom' ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div
                className="w-full max-w-5xl aspect-[1030/700] flex items-center justify-center"
                style={{ minHeight: 200 }}
              >
                <iframe
                  src="https://ustymukhman.github.io/webDOOM/public/"
                  className="w-full h-full"
                  style={{
                    border: `2px solid ${terminalTheme === 'green' ? '#00FF00' : '#FFBF00'}`,
                    borderRadius: 8,
                    width: '100%',
                    height: '100%',
                    minHeight: 200,
                  }}
                  allowFullScreen
                  title="DOOM"
                />
              </div>
              <div
                className="mt-4"
                style={{
                  color: currentTheme.text,
                  textShadow: `0 0 8px ${currentTheme.glow}`,
                }}
              >
                {t('terminal.games.doom.instruction')}
              </div>
              <button
                className="mt-4 px-4 py-2 bg-black border border-gray-200 rounded-sm"
                style={{
                  color: currentTheme.text,
                  borderColor: currentTheme.text,
                }}
                onClick={() => {
                  setIsPlayingGame(false);
                  setCurrentGame(null);
                }}
              >
                {t('terminal.games.doom.back')}
              </button>
            </div>
          ) : (
            <div
              ref={terminalRef}
              onClick={() => {
                const selection = window.getSelection();
                if (!selection || selection.toString().length === 0) {
                  inputRef.current?.focus();
                }
              }}
              className="relative w-full h-full overflow-y-auto overflow-x-auto p-2 sm:p-6 font-mono text-xs sm:text-sm cursor-text"
              style={{ fontFamily: '"Courier New", Courier, monospace' }}
            >
              {isPlayingGame ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <canvas
                    ref={gameCanvasRef}
                    width={400}
                    height={400}
                    className="border-2"
                    style={{ borderColor: currentTheme.text }}
                  />
                  <div
                    className={`mt-4 ${currentTheme.textClass}`}
                    style={{ textShadow: `0 0 8px ${currentTheme.glow}` }}
                  >
                    {currentGame === 'snake'
                      ? t('terminal.games.snake.instruction', {
                          keyboardLayout: keyboardLayout === 'azerty' ? 'ZQSD' : 'WASD',
                        })
                      : t('terminal.games.pong.instruction')}
                  </div>
                </div>
              ) : isBooting ? (
                <>
                  {bootLines.map((line, index) => (
                    <div
                      key={index}
                      className={currentTheme.textClass}
                      style={{ textShadow: `0 0 8px ${currentTheme.glow}`, whiteSpace: 'pre' }}
                    >
                      {line}
                    </div>
                  ))}
                  <span
                    className={`animate-pulse ${currentTheme.textClass}`}
                    style={{ textShadow: `0 0 8px ${currentTheme.glow}` }}
                  >
                    ▌
                  </span>
                </>
              ) : (
                <>
                  {lines.map((line) => (
                    <div
                      key={line.id}
                      className={`mb-1 ${line.type === 'error' ? 'text-red-500' : currentTheme.textClass}`}
                      style={{ textShadow: `0 0 8px ${currentTheme.glow}`, whiteSpace: 'pre' }}
                    >
                      {line.text}
                    </div>
                  ))}

                  <div className="flex items-center">
                    <span
                      className={currentTheme.textClass}
                      style={{ textShadow: `0 0 8px ${currentTheme.glow}` }}
                    >
                      {awaitingPassword ? 'password:' : '>'}&nbsp;
                    </span>
                    <div className="relative flex-1 ml-2">
                      <input
                        ref={inputRef}
                        type={awaitingPassword ? 'password' : 'text'}
                        value={currentInput}
                        aria-label="Terminal command input"
                        onChange={(e) => {
                          setCurrentInput(e.target.value);
                          setCaretPos(e.target.selectionStart ?? 0);
                        }}
                        onKeyDown={(e) => {
                          handleKeyDown(e);
                          setTimeout(() => {
                            if (inputRef.current) {
                              setCaretPos(inputRef.current.selectionStart ?? 0);
                            }
                          }, 0);
                        }}
                        onClick={() => {
                          if (inputRef.current) {
                            setCaretPos(inputRef.current.selectionStart ?? 0);
                          }
                        }}
                        onSelect={() => {
                          if (inputRef.current) {
                            setCaretPos(inputRef.current.selectionStart ?? 0);
                          }
                        }}
                        className={`w-full bg-transparent border-none outline-none ${currentTheme.textClass} font-mono caret-transparent`}
                        style={{
                          textShadow: `0 0 8px ${currentTheme.glow}`,
                          fontFamily: '"Courier New", Courier, monospace',
                        }}
                        autoFocus
                      />
                      <span
                        className={`absolute top-0 animate-pulse ${currentTheme.textClass} pointer-events-none`}
                        style={{
                          textShadow: `0 0 8px ${currentTheme.glow}`,
                          left: `${caretPos * 0.6}em`,
                        }}
                      >
                        ▌
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CRT Screen Curve Effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 0%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          {/* CRT Noise Effect */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
              animation: 'noise 0.2s steps(10) infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
      `}</style>
    </div>
  );
}
