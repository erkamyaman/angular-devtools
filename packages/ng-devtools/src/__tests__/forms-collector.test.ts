// @vitest-environment jsdom
import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { attachForms, setupErrorOf } from '../forms-collector.ts';
import type { FormEvent } from '../forms.ts';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // already initialized in this worker
}

const stops: (() => void)[] = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  TestBed.resetTestingModule();
  document.body.innerHTML = '';
});

class Login {
  form = new FormGroup({
    email: new FormControl('', Validators.required),
  });
}
Component({
  selector: 'login-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form"><input id="email" formControlName="email" /><button>Go</button></form>`,
})(Login);

class Profile {
  form = form(signal({ name: '' }), (p) => required(p.name), {
    submission: { action: async () => undefined },
  });
}
Component({
  selector: 'profile-form',
  imports: [FormField, FormRoot],
  template: `<form [formRoot]="form"><input id="pname" [formField]="form.name" /><button>Go</button></form>`,
})(Profile);

function harness() {
  const calls: { name: string; args: any[] }[] = [];
  const handlers = new Map<string, (...args: any[]) => unknown>();
  const my = {
    rpc: {
      call: async (name: string, ...args: unknown[]) => {
        calls.push({ name, args });
      },
      register: (def: { name: string; handler: (...args: any[]) => unknown }) => {
        handlers.set(def.name, def.handler);
      },
    },
  };
  const collector = attachForms(my, 'pg', () => (globalThis as any).ng, {
    show: () => {},
    clear: () => {},
  });
  stops.push(collector.stop);
  const reports = () => calls.filter((c) => c.name === 'push-forms').map((c) => c.args[0]);
  const lastEvents = (): FormEvent[] => reports().at(-1)?.events ?? [];
  return { calls, handlers, collector, reports, lastEvents };
}

const tick = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('forms collector', () => {
  it('tags typing as user and code changes as code, with prev and repeat counts', async () => {
    const fixture = await mount(Login);
    const h = harness();
    h.collector.push();
    await tick();
    const input = document.getElementById('email') as HTMLInputElement;
    for (const text of ['a', 'ab', 'abc']) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await tick();
    fixture.componentInstance.form.controls.email.setValue('code@x.io');
    await tick();
    const values = h.lastEvents().filter((e) => e.type === 'value' && e.path === 'email');
    expect(values[0]).toMatchObject({ origin: 'user', count: 3, detail: '"abc"', prev: '""' });
    expect(values[1]).toMatchObject({ origin: 'code', detail: '"code@x.io"', prev: '"abc"' });
    expect(h.reports().at(-1).forms[0].submitDom.buttons).toBe(1);
  });

  it('records Signal Forms submits as blocked or ran', async () => {
    const fixture = await mount(Profile);
    const h = harness();
    h.collector.push();
    await tick();
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formEl.requestSubmit();
    await tick();
    fixture.componentInstance.form.name().value.set('Ada');
    formEl.requestSubmit();
    await tick();
    const submits = h.lastEvents().filter((e) => e.type === 'submit');
    expect(submits.map((e) => e.outcome)).toEqual(['blocked', 'ran']);
  });

  it('tags Signal Forms changes found by diffing as user or unknown', async () => {
    const fixture = await mount(Profile);
    const h = harness();
    h.collector.push();
    await tick();
    const input = document.getElementById('pname') as HTMLInputElement;
    input.value = 'Ada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    fixture.componentInstance.form.name().value.set('Bob');
    h.collector.push();
    await tick();
    const values = h.lastEvents().filter((e) => e.type === 'value' && e.path === 'name');
    expect(values.map((e) => [e.detail, e.origin])).toEqual([
      ['"Ada"', 'user'],
      ['"Bob"', undefined],
    ]);
  });

  it('answers form actions for its own forms only', async () => {
    const fixture = await mount(Login);
    const h = harness();
    h.collector.push();
    await tick();
    const formId = h.reports().at(-1).forms[0].id;
    h.handlers.get('form-action')!({
      requestId: 'r1',
      pageId: 'other',
      request: { action: 'touch-all', formId },
    });
    h.handlers.get('form-action')!({
      requestId: 'r2',
      pageId: 'pg',
      request: { action: 'touch-all', formId },
    });
    h.handlers.get('form-action')!({ requestId: 'r3', request: { action: 'drop-tables', formId } });
    await tick(200);
    const answers = h.calls.filter((c) => c.name === 'form-action-result').map((c) => c.args[0]);
    expect(answers.map((a) => a.requestId)).toEqual(['r3', 'r2']);
    expect(answers[0].result.error).toBe('Unknown form action.');
    expect(answers[1].result).toMatchObject({ ok: true });
    expect(fixture.componentInstance.form.controls.email.touched).toBe(true);
  });

  it('captures NG01xxx setup errors from console.error without leaking tokens', async () => {
    const original = console.error;
    console.error = () => {};
    try {
      const h = harness();
      console.error(new Error("NG01203: No value accessor for form control name: 'age'"));
      console.error('unrelated');
      await tick();
      expect(h.reports().at(-1)?.setupErrors).toEqual([
        "NG01203: No value accessor for form control name: 'age'",
      ]);
    } finally {
      stops.splice(0).forEach((stop) => stop());
      console.error = original;
    }
    expect(
      setupErrorOf([
        'NG01050: formControlName must be used with a parent formGroup Bearer abc.def',
      ]),
    ).toContain('Bearer [redacted]');
    expect(setupErrorOf(['plain error'])).toBeNull();
  });

  it('restores console.error and stops listening on stop', () => {
    const original = console.error;
    const h = harness();
    expect(console.error).not.toBe(original);
    stops.pop()!();
    expect(console.error).toBe(original);
    expect(h.calls).toEqual([]);
  });
});
