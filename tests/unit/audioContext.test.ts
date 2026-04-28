import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom does not provide AudioContext - we must stub it globally for every test.
// Use ES class stubs so `new AudioContext()` works correctly with the module code.
function makeRunningMock() {
  const resume = vi.fn().mockResolvedValue(undefined);
  class MockAudioContext {
    state = 'running' as const;
    resume = resume;
  }
  vi.stubGlobal('AudioContext', MockAudioContext);
  return { resume };
}

function makeSuspendedMock() {
  const resume = vi.fn().mockResolvedValue(undefined);
  class MockAudioContext {
    state = 'suspended' as const;
    resume = resume;
  }
  vi.stubGlobal('AudioContext', MockAudioContext);
  return { resume };
}

describe('audioContext singleton', () => {
  beforeEach(() => {
    // Fresh module so _ctx is always null at the start of each test.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getAudioContext returns the same instance on successive calls', async () => {
    makeRunningMock();
    const { getAudioContext } = await import('../../src/hooks/audioContext');
    const ctx1 = getAudioContext();
    const ctx2 = getAudioContext();
    expect(ctx1).toBe(ctx2);
  });

  it('resumeAudioContext resumes a suspended context', async () => {
    const { resume } = makeSuspendedMock();
    const { resumeAudioContext } = await import('../../src/hooks/audioContext');
    await resumeAudioContext();
    expect(resume).toHaveBeenCalledOnce();
  });

  it('resumeAudioContext does not call resume when already running', async () => {
    const { resume } = makeRunningMock();
    const { resumeAudioContext } = await import('../../src/hooks/audioContext');
    await resumeAudioContext();
    expect(resume).not.toHaveBeenCalled();
  });

  it('resumeAudioContext does not throw when AudioContext constructor throws', async () => {
    vi.stubGlobal('AudioContext', function () {
      throw new Error('not supported');
    });
    const { resumeAudioContext } = await import('../../src/hooks/audioContext');
    await expect(resumeAudioContext()).resolves.not.toThrow();
  });
});
