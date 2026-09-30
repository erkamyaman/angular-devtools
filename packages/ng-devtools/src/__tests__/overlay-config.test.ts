// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NgDevtoolsConfig } from '../config.ts';
import { isSecretKey, setRedaction } from '../forms-privacy.ts';

const calls: string[] = [];
let configs: Record<string, unknown> | undefined;

vi.mock('devframe/client', () => ({
  connectDevframe: async () => ({
    connectionMeta: { backend: 'websocket', configs },
    scope: () => ({
      rpc: {
        call: async (name: string) => {
          calls.push(name);
          return undefined;
        },
        register: () => {},
      },
    }),
  }),
}));

const stops: (() => void)[] = [];

async function start(config?: NgDevtoolsConfig) {
  calls.length = 0;
  configs = config ? { 'ng-devtools': config } : undefined;
  const { initOverlay } = await import('../overlay.ts');
  stops.push(await initOverlay());
  await new Promise((resolve) => setTimeout(resolve, 100));
  return new Set(calls);
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  sessionStorage.clear();
  setRedaction();
});

describe('overlay collectors', () => {
  it('run every collector when the server sends no config', async () => {
    const called = await start();
    expect(called).toContain('push-component-tree');
    expect(called).toContain('push-injector-tree');
    expect(called).toContain('push-router');
  });

  it('skip the collectors of disabled inspectors', async () => {
    const called = await start({ inspectors: { components: false, router: false } });
    expect(called).not.toContain('push-component-tree');
    expect(called).not.toContain('push-router');
    expect(called).toContain('push-injector-tree');
  });

  it('install the Elements-panel lookup only with the components inspector', async () => {
    await start();
    expect(window.__ngDevtoolsComponentOf).toBeTypeOf('function');
    stops.splice(0).forEach((stop) => stop());
    expect(window.__ngDevtoolsComponentOf).toBeUndefined();

    await start({ inspectors: { components: false } });
    expect(window.__ngDevtoolsComponentOf).toBeUndefined();
  });

  it('only tell the server to forget pages for enabled inspectors', async () => {
    await start({ inspectors: { forms: false } });
    calls.length = 0;
    dispatchEvent(new Event('pagehide'));
    expect(calls).not.toContain('forget-forms-page');
    expect(calls).toContain('forget-router-page');
  });

  it('apply the redaction config from the server before collecting', async () => {
    await start({ redaction: { secretNames: ['voucher'] } });
    expect(isSecretKey('voucherCode')).toBe(true);
  });
});
