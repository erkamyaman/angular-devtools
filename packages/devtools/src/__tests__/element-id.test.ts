import { describe, expect, it } from 'vitest';
import { elementById, elementId, elementIdCount, pruneElementIds } from '../element-id.ts';

const attached = () => ({ isConnected: true });
const detached = () => ({ isConnected: false });

describe('element ids', () => {
  it('keeps the map bounded when elements are detached and nothing prunes it', () => {
    const keeper = attached();
    const keeperId = elementId(keeper);
    for (let i = 0; i < 5000; i++) elementId(detached());
    expect(elementIdCount()).toBeLessThan(1200);
    expect(elementId(keeper)).toBe(keeperId);
    expect(elementById(keeperId)).toBe(keeper);
  });

  it('keeps ids of connected elements stable across many sweeps', () => {
    const live = Array.from({ length: 300 }, attached);
    const first = live.map((el) => elementId(el));
    for (let i = 0; i < 4000; i++) elementId(detached());
    expect(live.map((el) => elementId(el))).toEqual(first);
    expect(elementById(first[0])).toBe(live[0]);
  });

  it('sweeps with the predicate the last explicit prune used', () => {
    const view = { alive: true };
    const connected = (host: object) => (host as { alive?: boolean }).alive === true;
    pruneElementIds(connected);
    const id = elementId(view);
    for (let i = 0; i < 4000; i++) elementId({ alive: false });
    expect(elementById(id, connected)).toBe(view);
    pruneElementIds();
  });
});
