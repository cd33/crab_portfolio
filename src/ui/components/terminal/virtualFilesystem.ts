/**
 * Virtual filesystem for the RetroTerminal
 * Provides a readonly in-memory filesystem structure
 */
export type FSEntry = { type: 'file' | 'dir'; contentKey?: string };

/**
 * Build the virtual filesystem using i18n translation keys.
 * The actual content is resolved at runtime via `t(contentKey)`.
 */
export const FS_STRUCTURE: Record<string, FSEntry> = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/user': { type: 'dir' },
  '/home/user/README.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.readmeContent',
  },
  '/home/user/projects': { type: 'dir' },
  '/home/user/projects/projet_web_react.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.projectWeb',
  },
  '/home/user/projects/api_backend_node.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.projectAPI',
  },
  '/home/user/projects/optimisation_3d.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.projectOpti',
  },
  '/home/user/projects/integration_ci_cd.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.projectCICD',
  },
  '/system': { type: 'dir' },
  '/system/info.md': {
    type: 'file',
    contentKey: 'terminal.filesystem.sysinfo',
  },
};

/**
 * List entries directly inside a given directory path.
 */
export function listDirectory(dir: string): string[] {
  return Object.keys(FS_STRUCTURE).filter((path) => {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    return parentPath === dir && path !== dir;
  });
}

/**
 * Resolve a file path (case-insensitive) and return its content key.
 */
export function resolveFile(
  requestedPath: string,
  t: (key: string) => string
): { type: 'file' | 'dir'; content?: string } | null {
  const filePath = Object.keys(FS_STRUCTURE).find(
    (path) => path.toLowerCase() === requestedPath.toLowerCase()
  );
  if (!filePath) return null;

  const entry = FS_STRUCTURE[filePath];
  if (entry.type === 'dir') return { type: 'dir' };

  // Special case: sysinfo combines title + content
  if (entry.contentKey === 'terminal.filesystem.sysinfo') {
    return {
      type: 'file',
      content: `${t('terminal.filesystem.sysinfoTitle')}\n\n${t('terminal.filesystem.sysinfoContent')}`,
    };
  }

  return {
    type: 'file',
    content: entry.contentKey ? t(entry.contentKey) : '',
  };
}

/**
 * Resolve a target directory path from current directory + input.
 */
export function resolveDirectory(currentDirectory: string, targetDir: string): string | null {
  let newPath: string;

  if (targetDir === '/') {
    newPath = '/';
  } else if (targetDir === '..') {
    const parts = currentDirectory.split('/').filter(Boolean);
    parts.pop();
    newPath = parts.length > 0 ? `/${parts.join('/')}` : '/';
  } else if (targetDir.startsWith('/')) {
    newPath = targetDir;
  } else {
    newPath = currentDirectory === '/' ? `/${targetDir}` : `${currentDirectory}/${targetDir}`;
  }

  const entry = FS_STRUCTURE[newPath];
  if (entry && entry.type === 'dir') return newPath;
  return null;
}
