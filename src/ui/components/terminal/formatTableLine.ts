/**
 * Compte la largeur visuelle d'un texte en caractères monospace.
 * Les caractères double-largeur (CJK, certains emoji) comptent pour 2.
 * Les caractères de dessin de boîte et ASCII standard comptent pour 1.
 */
function visualCharWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    // Plages double-largeur (CJK, plein-écran, etc.)
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0x303e) ||
      (cp >= 0x3040 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe1f) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1f9ff)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

export function formatTableLine(text: string, totalLength = 50, title?: boolean): string {
  const visualLength = visualCharWidth(text);
  const missing = totalLength - visualLength;
  return text + '\u00A0'.repeat(Math.max(0, missing - 1)) + (title ? '║' : '│');
}
