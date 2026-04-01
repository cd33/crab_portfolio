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

export function formatTableLine(text: string, totalLength = 50, title?: boolean): string {
  const cacheKey = `${text}_${totalLength}`;
  if (textWidthCache.has(cacheKey)) {
    const cachedWidth = textWidthCache.get(cacheKey)!;
    const missing = totalLength - cachedWidth;
    return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
  }

  const ctx = getSharedCanvas();
  if (!ctx) {
    const missing = totalLength - text.length;
    return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
  }

  const textWidth = ctx.measureText(text).width;
  const charWidth = ctx.measureText('A').width;
  const visualLength = Math.round(textWidth / charWidth);

  textWidthCache.set(cacheKey, visualLength);

  const missing = totalLength - visualLength;
  return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
}
