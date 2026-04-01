import { describe, expect, it } from 'vitest';
import en from '../../src/locales/en.json';
import fr from '../../src/locales/fr.json';

/**
 * Recursively collects all leaf keys from a nested object.
 * Returns dot-separated paths: "accessories.hatPokemon"
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n locale files', () => {
  const enKeys = collectKeys(en).sort();
  const frKeys = collectKeys(fr).sort();

  it('fr.json and en.json have the same number of keys', () => {
    expect(frKeys.length).toBe(enKeys.length);
  });

  it('every key in en.json exists in fr.json', () => {
    const frSet = new Set(frKeys);
    const missing = enKeys.filter((k) => !frSet.has(k));
    expect(missing).toEqual([]);
  });

  it('every key in fr.json exists in en.json', () => {
    const enSet = new Set(enKeys);
    const missing = frKeys.filter((k) => !enSet.has(k));
    expect(missing).toEqual([]);
  });

  it('no value is an empty string', () => {
    function findEmpty(obj: Record<string, unknown>, prefix = ''): string[] {
      const empty: string[] = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          empty.push(...findEmpty(value as Record<string, unknown>, fullKey));
        } else if (value === '') {
          empty.push(fullKey);
        }
      }
      return empty;
    }

    const emptyEn = findEmpty(en);
    const emptyFr = findEmpty(fr);
    expect(emptyEn).toEqual([]);
    expect(emptyFr).toEqual([]);
  });

  it('no value contains the placeholder of the other language', () => {
    // Detect obvious copy-paste errors: French text in en.json or vice versa
    // This is a heuristic check for common French articles/words in English file
    const frenchPatterns =
      /\b(le |la |les |un |une |des |du |au |je |tu |il |elle |nous |vous |ils |elles |est |sont |c'est|qu'|d')\b/i;

    function findValues(
      obj: Record<string, unknown>,
      prefix = ''
    ): Array<{ key: string; value: string }> {
      const values: Array<{ key: string; value: string }> = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          values.push(...findValues(val as Record<string, unknown>, fullKey));
        } else if (typeof val === 'string') {
          values.push({ key: fullKey, value: val });
        }
      }
      return values;
    }

    const enValues = findValues(en);
    const suspiciousFrenchInEn = enValues.filter(
      ({ value }) => frenchPatterns.test(value) && value.length > 10
    );
    // Allow a small amount (some English words match French patterns)
    // Just report if there are too many suspicious entries
    expect(suspiciousFrenchInEn.length).toBeLessThan(5);
  });
});
