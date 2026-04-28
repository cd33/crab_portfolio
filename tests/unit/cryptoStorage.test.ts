/**
 * Tests unitaires pour le module de chiffrement AES-GCM
 * src/utils/cryptoStorage.ts
 */
import { describe, expect, it } from 'vitest';
import { decryptData, encryptData } from '../../src/utils/cryptoStorage';

describe('cryptoStorage', () => {
  it('chiffre une chaîne et la déchiffre correctement', async () => {
    const original = 'Hello, Crab Portfolio!';
    const encrypted = await encryptData(original);
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(original);
  });

  it('le contenu chiffré est différent du texte en clair', async () => {
    const plain = JSON.stringify({ state: { doorCount: 3 }, version: 0 });
    const encrypted = await encryptData(plain);
    expect(encrypted).not.toBe(plain);
    expect(() => JSON.parse(encrypted)).toThrow(); // base64, pas du JSON
  });

  it('deux chiffrements du même texte produisent des résultats différents (IV aléatoire)', async () => {
    const plain = 'same input';
    const enc1 = await encryptData(plain);
    const enc2 = await encryptData(plain);
    expect(enc1).not.toBe(enc2);
    // Mais les deux se déchiffrent correctement
    expect(await decryptData(enc1)).toBe(plain);
    expect(await decryptData(enc2)).toBe(plain);
  });

  it('le déchiffrement échoue sur des données corrompues', async () => {
    await expect(decryptData('donnees_invalides_base64')).rejects.toThrow();
  });

  it('round-trip avec un objet JSON complexe contenant des caractères spéciaux', async () => {
    const data = JSON.stringify({
      state: {
        discoveredObjects: { __type: 'Set', values: ['poster_1', 'mug', 'cv_sheet'] },
        konamiActivated: true,
        volume: 0.75,
        terminalTheme: 'amber',
      },
      version: 0,
    });
    const encrypted = await encryptData(data);
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(data);
    const parsed = JSON.parse(decrypted);
    expect(parsed.state.konamiActivated).toBe(true);
    expect(parsed.state.discoveredObjects.values).toHaveLength(3);
  });
});
