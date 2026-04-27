import { PASSWORD_HASHES, PASSWORDS_COUNT, sha256, verifyPassword } from '@/utils/constants';
import { describe, expect, it } from 'vitest';

describe('sha256', () => {
  it('returns a 64-character hex string', async () => {
    const hash = await sha256('hello');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', async () => {
    const h1 = await sha256('test-password');
    const h2 = await sha256('test-password');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', async () => {
    const h1 = await sha256('abc');
    const h2 = await sha256('ABC');
    expect(h1).not.toBe(h2);
  });

  it('produces the same hash as a cross-check via verifyPassword', async () => {
    const hash = await sha256('abc');
    // A hash of 'abc' must verify correctly against itself
    expect(await verifyPassword('abc', hash)).toBe(true);
    // And fail against a different input
    expect(await verifyPassword('ABC', hash)).toBe(false);
  });
});

describe('verifyPassword', () => {
  it('returns true when input matches the stored hash', async () => {
    const hash = await sha256('my-secret');
    expect(await verifyPassword('my-secret', hash)).toBe(true);
  });

  it('returns false when input does not match the stored hash', async () => {
    const hash = await sha256('my-secret');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('is case-sensitive', async () => {
    const hash = await sha256('Password');
    expect(await verifyPassword('password', hash)).toBe(false);
  });

  it('rejects empty string against a non-empty hash', async () => {
    const hash = await sha256('non-empty');
    expect(await verifyPassword('', hash)).toBe(false);
  });
});

describe('PASSWORD_HASHES', () => {
  it(`contains ${PASSWORDS_COUNT} entries`, () => {
    expect(PASSWORD_HASHES).toHaveLength(PASSWORDS_COUNT);
  });

  it('each entry is a 64-character hex string', () => {
    PASSWORD_HASHES.forEach((h) => {
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  it('all hashes are unique', () => {
    const unique = new Set(PASSWORD_HASHES);
    expect(unique.size).toBe(PASSWORDS_COUNT);
  });

  it('PASSWORDS_COUNT equals PASSWORD_HASHES.length', () => {
    expect(PASSWORDS_COUNT).toBe(PASSWORD_HASHES.length);
  });

  // Verify stored hashes match the expected passwords (guards against accidental modification)
  it.each([
    [0, '5b34d927b251c12992dca0ccf2a41ba97d1618730f0421dd2268784f29d5ce0c'],
    [1, 'f51b3fe579785acdf5e830d257619c2e06af735275b690ac00e813a167ec4fc2'],
    [2, '797fba4e523f39e28bc4469ad6353509bd6dec30fa1c93ab5e02444ea4d38da1'],
    [3, '6b0ceb02aaa765e0f36bf10a4315d4365ebf12e57f2804daadb3338d048bc7d9'],
    [4, '31ff564ed20c422f96bc35b3f60b4a86c7ddebff58dcb7d1b6f4355e98419c8e'],
  ])('PASSWORD_HASHES[%i] equals expected hash', (index, expected) => {
    expect(PASSWORD_HASHES[index]).toBe(expected);
  });
});
