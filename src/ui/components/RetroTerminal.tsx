import { useI18n } from '@/hooks/useI18n';
import { useSound } from '@/hooks/useSound';
import { useStore } from '@/store/useStore';
import { PASSWORDS } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';

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

// function formatTableLine(text: string, totalLength = 50, title?: boolean): string {
//   // Place le padding avant le dernier caractère (│)
//   const missing = totalLength - text.length;
//   if (text.includes('😀󠅛󠄣󠄣󠅠󠅏󠅣󠅝󠄡󠅜󠄡󠅞󠅗')) {
//     console.log('text', text);
//     console.log('totalLength', totalLength);
//     console.log('text.length', text.length);
//     console.log('missing', missing);
//   }
//   return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
// }

// Cache pour éviter de recalculer les largeurs
const textWidthCache = new Map<string, number>();
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvas(): CanvasRenderingContext2D | null {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCtx = sharedCanvas.getContext('2d');
    if (sharedCtx) {
      sharedCtx.font = '16px "Courier New", Courier, monospace';
    }
  }
  return sharedCtx;
}

function formatTableLine(text: string, totalLength = 50, title?: boolean): string {
  // Vérifier le cache d'abord
  const cacheKey = `${text}_${totalLength}`;
  if (textWidthCache.has(cacheKey)) {
    const cachedWidth = textWidthCache.get(cacheKey)!;
    const missing = totalLength - cachedWidth;
    return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
  }

  // Obtenir le canvas partagé
  const ctx = getSharedCanvas();
  if (!ctx) {
    // Fallback si canvas n'est pas disponible
    const missing = totalLength - text.length;
    return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
  }

  // Mesurer la largeur du texte
  const textWidth = ctx.measureText(text).width;
  const charWidth = ctx.measureText('A').width;
  const visualLength = Math.round(textWidth / charWidth);

  // Mettre en cache
  textWidthCache.set(cacheKey, visualLength);

  const missing = totalLength - visualLength;
  return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
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
  } = useStore();
  const { t } = useI18n();
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
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

  // Virtual filesystem
  const virtualFS: Record<string, { type: 'file' | 'dir'; content?: string }> = {
    '/': { type: 'dir' },
    '/home': { type: 'dir' },
    '/home/user': { type: 'dir' },
    '/home/user/README.md': {
      type: 'file',
      content: t('terminal.filesystem.readmeContent'),
    },
    '/home/user/projects': { type: 'dir' },
    '/home/user/projects/projet_web_react.md': {
      type: 'file',
      content: t('terminal.filesystem.projectWeb'),
    },
    '/home/user/projects/api_backend_node.md': {
      type: 'file',
      content: t('terminal.filesystem.projectAPI'),
    },
    '/home/user/projects/optimisation_3d.md': {
      type: 'file',
      content: t('terminal.filesystem.projectOpti'),
    },
    '/home/user/projects/integration_ci_cd.md': {
      type: 'file',
      content: t('terminal.filesystem.projectCICD'),
    },
    '/system': { type: 'dir' },
    '/system/info.md': {
      type: 'file',
      content: `${t('terminal.filesystem.sysinfoTitle')}\n\n${t('terminal.filesystem.sysinfoContent')}`,
    },
  };

  // Theme colors configuration
  const themeColors = {
    green: {
      text: '#00FF00',
      textClass: 'text-green-500',
      glow: 'rgba(0, 255, 0, 0.8)',
      glowLight: 'rgba(0, 255, 0, 0.4)',
      bgOverlay: 'bg-green-500/5',
      scanlines: 'rgba(0, 255, 0, 0.03)',
    },
    amber: {
      text: '#FFBF00',
      textClass: 'text-amber-500',
      glow: 'rgba(255, 191, 0, 0.8)',
      glowLight: 'rgba(255, 191, 0, 0.4)',
      bgOverlay: 'bg-amber-500/5',
      scanlines: 'rgba(255, 191, 0, 0.03)',
    },
  };

  const currentTheme = themeColors[terminalTheme];

  const toggleTheme = () => {
    setTerminalTheme(terminalTheme === 'green' ? 'amber' : 'green');
  };

  // Boot sequence animation
  useEffect(() => {
    if (!isTerminalOpen) return;

    // Reset boot state when terminal opens
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
        // Boot complete, show terminal
        clearInterval(bootInterval);
        setTimeout(() => {
          setIsBooting(false);
          setLines([
            { id: 0, text: t('terminal.bootSequence.version'), type: 'output' },
            { id: 1, text: t('terminal.bootSequence.helpPrompt'), type: 'output' },
            { id: 2, text: '', type: 'output' },
          ]);
        }, 300);
      }
    }, 100); // 100ms per line for fast boot feel

    return () => clearInterval(bootInterval);
  }, [isTerminalOpen, t]);

  // Matrix rain effect for hacker mode
  useEffect(() => {
    if (!hackerModeActive || !matrixCanvasRef.current) return;

    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix rain configuration
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // Characters to use (including Japanese Katakana like in the movie)
    const matrixChars =
      'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:・."=*+-<>¦｜╌';

    const drawMatrix = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text style
      ctx.fillStyle = terminalTheme === 'green' ? '#0F0' : '#FFBF00';
      ctx.font = `${fontSize}px monospace`;

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Brighter color for the head of the column
        if (Math.random() > 0.975) {
          ctx.fillStyle = terminalTheme === 'green' ? '#FFF' : '#FFFF00';
        } else {
          ctx.fillStyle = terminalTheme === 'green' ? '#0F0' : '#FFBF00';
        }

        ctx.fillText(char, x, y);

        // Reset drop to top randomly or when it reaches bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(drawMatrix, 35);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [hackerModeActive, terminalTheme]);

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

  const addLine = (text: string, type: TerminalLine['type'] = 'output') => {
    setLines((prev) => [...prev, { id: lineIdCounter.current++, text, type }]);
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    // Handle password input mode
    if (awaitingPassword) {
      addLine(`> ${cmd}`, 'input');

      if (trimmedCmd === 'admin') {
        const file = virtualFS[passwordTarget];
        if (file && file.content) {
          file.content.split('\n').forEach((line) => addLine(line, 'output'));
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

    // Separate command from arguments
    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();

    // Add command to history
    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
    }

    // Add input line to display
    addLine(`> ${cmd}`, 'input');

    // Check for aliases
    const resolvedCmd = commandAliases[command] || command;

    // Execute command
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
        // List files in current directory
        const files = Object.keys(virtualFS).filter((path) => {
          const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
          return parentPath === currentDirectory && path !== currentDirectory;
        });

        if (files.length === 0) {
          addLine(t('terminal.errors.emptyDirectory'), 'output');
        } else {
          files.forEach((file) => {
            const name = file.substring(file.lastIndexOf('/') + 1);
            const item = virtualFS[file];
            const displayName = item.type === 'dir' ? `${name}/` : name;
            addLine(displayName, 'output');
          });
        }
        break;
      }

      case 'cd': {
        // Change directory
        const args = cmd.trim().split(' ');
        if (args.length < 2) {
          addLine(t('terminal.errors.usage', { usage: 'cd <directory>' }), 'error');
          break;
        }

        const targetDir = args[1];
        let newPath: string;

        if (targetDir === '/') {
          newPath = '/';
        } else if (targetDir === '..') {
          // Go up one directory
          const parts = currentDirectory.split('/').filter(Boolean);
          parts.pop();
          newPath = parts.length > 0 ? `/${parts.join('/')}` : '/';
        } else if (targetDir.startsWith('/')) {
          // Absolute path
          newPath = targetDir;
        } else {
          // Relative path
          newPath = currentDirectory === '/' ? `/${targetDir}` : `${currentDirectory}/${targetDir}`;
        }

        // Check if directory exists
        if (virtualFS[newPath] && virtualFS[newPath].type === 'dir') {
          setCurrentDirectory(newPath);
        } else {
          addLine(t('terminal.errors.dirNotFound', { dir: targetDir }), 'error');
        }
        break;
      }

      case 'cat': {
        // Display file contents
        const args = cmd.trim().split(' ');
        if (args.length < 2) {
          addLine(t('terminal.errors.usage', { usage: 'cat <file>' }), 'error');
          break;
        }

        const fileName = args[1];
        const requestedPath = fileName.startsWith('/')
          ? fileName
          : currentDirectory === '/'
            ? `/${fileName}`
            : `${currentDirectory}/${fileName}`;

        // Find file case-insensitively
        const filePath = Object.keys(virtualFS).find(
          (path) => path.toLowerCase() === requestedPath.toLowerCase()
        );

        if (!filePath) {
          addLine(t('terminal.errors.fileNotFound', { file: fileName }), 'error');
        } else {
          const file = virtualFS[filePath];
          if (file.type === 'dir') {
            addLine(`cat: ${fileName}: Is a directory`, 'error');
          } else {
            const content = file.content || '';
            content.split('\n').forEach((line) => addLine(line, 'output'));
          }
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
        if (doorCount >= PASSWORDS.length) {
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

      case 'sysinfo':
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
          const navWithMemory = navigator as NavigatorWithMemory;
          addLine(formatTableLine(`│ Device Memory: ${navWithMemory.deviceMemory} GB`), 'output');
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
          const navWithConnection = navigator as NavigatorWithMemory;
          const conn = navWithConnection.connection;
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

      case 'whoami': {
        const newCount = whoamiCount + 1;
        setWhoamiCount(newCount);

        if (newCount === 2) {
          addLine(t('terminal.whoami.second'), 'output');
        } else if (newCount === 3) {
          addLine(t('terminal.whoami.third'), 'output');
        } else if (newCount === 4) {
          addLine(t('terminal.whoami.fourth'), 'output');
        } else if (newCount >= 5) {
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
        // Close terminal after a short delay
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
        // Système de validation multi-mots de passe pour déverrouiller la porte
        // 5 étapes, chaque étape = 1 mot de passe
        // Après chaque succès, mailCount++ (nouveau mail du patron)
        // Statut : LOCKED / PARTIAL / COMPLETE
        if (doorCount >= PASSWORDS.length) {
          addLine(t('terminal.door.statusComplete'), 'output');
          addLine(t('terminal.door.alreadyUnlocked'), 'output');
          break;
        }

        const args = cmd.trim().split(' ');
        if (args.length === 1) {
          // Affiche le statut
          if (doorCount === 0) {
            addLine(t('terminal.door.statusLocked'), 'output');
            addLine(t('terminal.door.enterPassword'), 'output');
          } else {
            addLine(
              t('terminal.door.statusPartial', { stage: doorCount, total: PASSWORDS.length }),
              'output'
            );
            addLine(t('terminal.door.enterPassword'), 'output');
          }
        } else {
          const input = args[1];
          if (input === PASSWORDS[doorCount]) {
            incrementDoorCount();
            incrementMailCount(); // Débloque un mail à chaque étape
            if (mailCount === 2) {
              incrementMailCount(); // Double increment pour débloquer mail4 directement
            } else if (doorCount === 4) {
              logSound.play(); // Fin de la game, son de log
            }
            addLine(t('terminal.door.newMailNotification'), 'output');
            addLine(
              t('terminal.door.stageComplete', { stage: doorCount + 1, total: PASSWORDS.length }),
              'output'
            );
            if (doorCount + 1 < PASSWORDS.length) {
              addLine(t('terminal.door.awaitingNext'), 'output');
              addLine(t('terminal.door.enterPassword'), 'output');
              if (doorCount === 3) {
                console.log('Presque, mais pas tout à fait...');
                localStorage.setItem('crab_context', PASSWORDS[4]);
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
                : t('terminal.door.statusPartial', { stage: doorCount, total: PASSWORDS.length }),
              'output'
            );
            addLine(t('terminal.door.tryAgain'), 'output');
          }
        }
        break;
      }

      case '':
        // Empty command, just add blank line
        break;

      case 'ai_chat':
      case 'run ai_chat': {
        const intro = [
          { text: '╔════════════════════════════════════════════════╗', type: 'output' },
          { text: formatTableLine('║ RETRO AI ASSISTANT v0.9β', 50, true), type: 'output' },
          { text: '╚════════════════════════════════════════════════╝', type: 'output' },
          { text: '', type: 'output' },
        ];
        const aiLines = [
          { text: t('terminal.ai_chat.greeting'), type: 'output' },
          { text: '', type: 'output' },
          { text: t('terminal.ai_chat.explore'), type: 'output' },
          { text: t('terminal.ai_chat.sarcasticRemark'), type: 'output' },
          { text: '', type: 'output' },
          { text: t('terminal.ai_chat.difficulty'), type: 'output' },
          { text: t('terminal.ai_chat.hackerJoke'), type: 'output' },
          { text: '', type: 'output' },
          {
            text: 'Something went wrong... if the problem persists please try again later',
            type: 'error',
          },
          { text: '', type: 'output' },
        ];
        (async () => {
          intro.forEach((line) => addLine(line.text, line.type as TerminalLine['type']));
          for (let i = 0; i < aiLines.length; i++) {
            await new Promise((res) => setTimeout(res, i === aiLines.length - 2 ? 1200 : 600));
            addLine(aiLines[i].text, aiLines[i].type as TerminalLine['type']);
          }
        })();
        break;
      }

      case 'alias': {
        const args = cmd.trim().split(' ');
        if (args.length === 1) {
          // List all aliases
          addLine(t('terminal.alias.current'), 'output');
          Object.entries(commandAliases).forEach(([alias, command]) => {
            addLine(`  ${alias} → ${command}`, 'output');
          });
          addLine('', 'output');
          addLine('Usage: alias <name>=<command>', 'output');
        } else if (args[1].includes('=')) {
          const [alias, command] = args[1].split('=');
          setCommandAliases((prev) => ({ ...prev, [alias]: command }));
          addLine(`${t('terminal.alias.created')} ${alias} → ${command}`, 'output');
        } else {
          addLine('Usage: alias <name>=<command>', 'error');
        }
        break;
      }

      case 'hacker':
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent event from bubbling to game controls
    e.stopPropagation();

    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-completion
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

      const parts = input.split(' ');
      const commandPart = parts[0].toLowerCase();

      if (parts.length === 1) {
        // Complete command
        const matches = allCommands.filter((cmd) => cmd.startsWith(commandPart));
        if (matches.length === 1) {
          setCurrentInput(matches[0]);
        } else if (matches.length > 1) {
          addLine(`> ${input}`, 'input');
          addLine(matches.join('  '), 'output');
        }
      } else if (commandPart === 'cat' || commandPart === 'cd') {
        // Complete file/directory names
        const prefix = parts[1] || '';
        const files = Object.keys(virtualFS).filter((path) => {
          const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
          return parentPath === currentDirectory && path !== currentDirectory;
        });

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

  // Snake Game Logic
  useEffect(() => {
    if (!isPlayingGame || currentGame !== 'snake' || !gameCanvasRef.current) return;

    const canvas = gameCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = 20;
    const snake = [{ x: 10, y: 10 }];
    let direction = { x: 1, y: 0 };
    let food = { x: 15, y: 15 };
    let score = 0;
    let gameOver = false;

    const handleGameKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlayingGame(false);
        setCurrentGame(null);
        addLine('', 'output');
        addLine(`${t('terminal.games.snake.gameOver')} ${score}`, 'output');
        addLine('', 'output');
        return;
      }

      const forwardKey = keyboardLayout === 'azerty' ? 'z' : 'w';
      const backwardKey = 's';
      const leftKey = keyboardLayout === 'azerty' ? 'q' : 'a';
      const rightKey = 'd';

      if (e.key === forwardKey && direction.y === 0) direction = { x: 0, y: -1 };
      if (e.key === backwardKey && direction.y === 0) direction = { x: 0, y: 1 };
      if (e.key === leftKey && direction.x === 0) direction = { x: -1, y: 0 };
      if (e.key === rightKey && direction.x === 0) direction = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', handleGameKey);

    const gameLoop = setInterval(() => {
      if (gameOver) return;

      // Move snake
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      // Check collision with walls
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
        setIsPlayingGame(false);
        setCurrentGame(null);
        addLine('', 'output');
        addLine(t('terminal.games.snake.deadWall'), 'error');
        addLine(`${t('terminal.games.snake.finalScore')} ${score}`, 'output');
        addLine('', 'output');
        return;
      }

      // Check collision with self
      if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        setIsPlayingGame(false);
        setCurrentGame(null);
        addLine('', 'output');
        addLine(t('terminal.games.snake.deadSelf'), 'error');
        addLine(`${t('terminal.games.snake.finalScore')} ${score}`, 'output');
        addLine('', 'output');
        return;
      }

      snake.unshift(head);

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        score++;
        food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
      } else {
        snake.pop();
      }

      // Draw
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      ctx.fillStyle = terminalTheme === 'green' ? '#00FF00' : '#FFBF00';
      snake.forEach((segment) => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });

      // Draw food
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

      // Draw score
      ctx.fillStyle = terminalTheme === 'green' ? '#00FF00' : '#FFBF00';
      ctx.font = '16px "Courier New"';
      ctx.fillText(`Score: ${score}`, 10, 20);
    }, 150);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleGameKey);
    };
  }, [isPlayingGame, currentGame, terminalTheme, keyboardLayout, t]);

  // Pong Game Logic
  useEffect(() => {
    if (!isPlayingGame || currentGame !== 'pong' || !gameCanvasRef.current) return;

    const canvas = gameCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paddleHeight = 80;
    const paddleWidth = 10;
    const leftPaddle = { x: 10, y: 160 };
    const rightPaddle = { x: 380, y: 160 };
    let ball = { x: 200, y: 200, dx: 3, dy: 3 };
    const score = { left: 0, right: 0 };
    let gameOver = false;

    const keys: Record<string, boolean> = {};
    const forwardKey = keyboardLayout === 'azerty' ? 'z' : 'w';
    const backwardKey = 's';

    const handleGameKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlayingGame(false);
        setCurrentGame(null);
        addLine('', 'output');
        addLine(`Game Over! Score: ${score.left} - ${score.right}`, 'output');
        addLine('', 'output');
        return;
      }
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleGameKey);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = setInterval(() => {
      if (gameOver) return;

      // Move paddles
      if (keys[forwardKey] && leftPaddle.y > 0) leftPaddle.y -= 5;
      if (keys[backwardKey] && leftPaddle.y < 400 - paddleHeight) leftPaddle.y += 5;
      if (keys['arrowup'] && rightPaddle.y > 0) rightPaddle.y -= 5;
      if (keys['arrowdown'] && rightPaddle.y < 400 - paddleHeight) rightPaddle.y += 5;

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with top/bottom
      if (ball.y <= 0 || ball.y >= 400) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddles
      if (
        ball.x <= leftPaddle.x + paddleWidth &&
        ball.y >= leftPaddle.y &&
        ball.y <= leftPaddle.y + paddleHeight
      ) {
        ball.dx = Math.abs(ball.dx);
      }

      if (
        ball.x >= rightPaddle.x - 10 &&
        ball.y >= rightPaddle.y &&
        ball.y <= rightPaddle.y + paddleHeight
      ) {
        ball.dx = -Math.abs(ball.dx);
      }

      // Scoring
      if (ball.x < 0) {
        score.right++;
        ball = { x: 200, y: 200, dx: 3, dy: 3 };
      }
      if (ball.x > 400) {
        score.left++;
        ball = { x: 200, y: 200, dx: -3, dy: 3 };
      }

      // Check win condition
      if (score.left >= 5 || score.right >= 5) {
        gameOver = true;
        setIsPlayingGame(false);
        setCurrentGame(null);
        addLine('', 'output');
        addLine(`🏆 ${score.left >= 5 ? 'Left Player' : 'Right Player'} Wins!`, 'output');
        addLine(`Final Score: ${score.left} - ${score.right}`, 'output');
        addLine('', 'output');
        return;
      }

      // Draw
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      ctx.fillStyle = terminalTheme === 'green' ? '#00FF00' : '#FFBF00';
      ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

      // Draw ball
      ctx.fillRect(ball.x, ball.y, 10, 10);

      // Draw center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = terminalTheme === 'green' ? '#00FF00' : '#FFBF00';
      ctx.beginPath();
      ctx.moveTo(200, 0);
      ctx.lineTo(200, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw score
      ctx.font = '24px "Courier New"';
      ctx.fillText(`${score.left}`, 150, 40);
      ctx.fillText(`${score.right}`, 230, 40);
    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleGameKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayingGame, currentGame, terminalTheme, keyboardLayout]);

  if (!isTerminalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* CRT Screen Container */}
      <div className="relative w-full h-full max-w-7xl max-h-screen p-8">
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

          {/* Terminal Content - Doom iframe affiché en priorité */}
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
                  color: terminalTheme === 'green' ? '#00FF00' : '#FFBF00',
                  textShadow: `0 0 8px ${terminalTheme === 'green' ? '#00FF00' : '#FFBF00'}`,
                }}
              >
                {t('terminal.games.doom.instruction')}
              </div>
              <button
                className="mt-4 px-4 py-2 bg-black border rounded"
                style={{
                  color: terminalTheme === 'green' ? '#00FF00' : '#FFBF00',
                  borderColor: terminalTheme === 'green' ? '#00FF00' : '#FFBF00',
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
                // Only focus input if no text is selected
                const selection = window.getSelection();
                if (!selection || selection.toString().length === 0) {
                  inputRef.current?.focus();
                }
              }}
              className={`relative w-full h-full overflow-y-auto p-6 font-mono text-sm sm:text-base cursor-text`}
              style={{
                fontFamily: '"Courier New", Courier, monospace',
              }}
            >
              {isPlayingGame ? (
                /* Game Canvas */
                <div className="flex flex-col items-center justify-center h-full">
                  <canvas
                    ref={gameCanvasRef}
                    width={400}
                    height={400}
                    className="border-2"
                    style={{
                      borderColor: terminalTheme === 'green' ? '#00FF00' : '#FFBF00',
                    }}
                  />
                  <div
                    className={`mt-4 ${currentTheme.textClass}`}
                    style={{ textShadow: `0 0 8px ${currentTheme.glow}` }}
                  >
                    {currentGame === 'snake'
                      ? t(`terminal.games.snake.instruction`, {
                          keyboardLayout: keyboardLayout === 'azerty' ? 'ZQSD' : 'WASD',
                        })
                      : t('terminal.games.pong.instruction')}
                  </div>
                </div>
              ) : isBooting ? (
                /* Boot Sequence */
                <>
                  {bootLines.map((line, index) => (
                    <div
                      key={index}
                      className={currentTheme.textClass}
                      style={{
                        textShadow: `0 0 8px ${currentTheme.glow}`,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                  {/* Blinking cursor during boot */}
                  <span
                    className={`animate-pulse ${currentTheme.textClass}`}
                    style={{ textShadow: `0 0 8px ${currentTheme.glow}` }}
                  >
                    ▌
                  </span>
                </>
              ) : (
                /* Normal Terminal */
                <>
                  {/* Terminal Lines */}
                  {lines.map((line) => (
                    <div
                      key={line.id}
                      className={`mb-1 ${
                        line.type === 'input'
                          ? currentTheme.textClass
                          : line.type === 'error'
                            ? 'text-red-500'
                            : currentTheme.textClass
                      }`}
                      style={{
                        textShadow: `0 0 8px ${currentTheme.glow}`,
                      }}
                    >
                      {line.text}
                    </div>
                  ))}

                  {/* Input Line */}
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
                      {/* Blinking Cursor at caret position */}
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

          {/* CRT Screen Curve Effect (subtle) */}
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
