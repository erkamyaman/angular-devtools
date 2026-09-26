import {
  collectForms,
  detailOf,
  diffForms,
  findFieldElement,
  findForms,
  formIdFor,
  propertyHolding,
  serializeControl,
  watchControlEvents,
  type CollectedForm,
  type EventOrigin,
  type FormEvent,
  type FormFieldNode,
  type FoundForm,
} from './forms.ts';
import { isDevtoolsAction, isFormAction, runFormAction } from './forms-actions.ts';
import { redactMessage } from './forms-privacy.ts';

type AnyRecord = Record<string, any>;

interface Rpc {
  rpc: {
    call(name: string, ...args: unknown[]): Promise<unknown>;
    register(definition: {
      name: string;
      type: 'event';
      jsonSerializable: boolean;
      handler: (...args: any[]) => unknown;
    }): void;
  };
}

const MAX_FORM_EVENTS = 200;
const HEARTBEAT_MS = 5000;
const PUSH_DELAY_MS = 80;
const MAX_SETUP_ERRORS = 20;
const MERGE_MS = 2000;
const DIFFED_FOR_ALL: FormEvent['type'][] = [
  'value',
  'status',
  'touched',
  'dirty',
  'added',
  'removed',
];
const USER_EVENTS = ['input', 'change', 'focusout', 'submit', 'reset', 'click', 'keydown'];

function read<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function isFieldTarget(target: unknown): target is { formId: string; path: string } {
  const t = target as { formId?: unknown; path?: unknown } | null;
  return (
    typeof t?.formId === 'string' &&
    typeof t.path === 'string' &&
    t.formId.length < 50 &&
    t.path.length < 500
  );
}

export function describeElement(el: Element | null): string | undefined {
  if (!el || el === document.body) return undefined;
  const tag = el.tagName.toLowerCase();
  const name = el.getAttribute('name') || el.getAttribute('formcontrolname') || el.id;
  return name ? `${tag}[${name}]` : tag;
}

export function setupErrorOf(args: unknown[]): string | null {
  const text = args
    .map((arg) => (arg instanceof Error ? arg.message : typeof arg === 'string' ? arg : ''))
    .join(' ');
  const match = text.match(/NG0?1\d{3}[^\n]*/);
  return match ? redactMessage(match[0]).slice(0, 300) : null;
}

function afterPaint(fn: () => void) {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
  else setTimeout(fn, 16);
}

export interface FormsCollector {
  push(): void;
  stop(): void;
}

export function attachForms(
  my: Rpc,
  pageId: string,
  getNg: () => any,
  highlight: { show(el: HTMLElement): void; clear(): void },
): FormsCollector {
  const idOf = (root: object) => `${formIdFor(root)}@${pageId}`;
  let lastForms: CollectedForm[] = [];
  let lastPayload = '';
  let lastPushAt = 0;
  const formEvents: FormEvent[] = [];
  const watched = new Map<object, { formId: string; stop: () => void }>();
  const lastStatus = new Map<string, string>();
  const lastValue = new Map<string, string>();
  const pendingSince = new Map<string, number>();
  const wrappedSubmits = new WeakSet<object>();
  const unwrapSubmits: (() => void)[] = [];
  const setupErrors: string[] = [];
  let foundById = new Map<string, FoundForm>();
  let fieldElements = new WeakMap<object, Element>();
  let eventSeq = 0;
  let userActive = false;
  let userSincePush = false;
  let devtoolsSincePush = false;
  let userTimer: ReturnType<typeof setTimeout> | undefined;
  let pushTimer: ReturnType<typeof setTimeout> | undefined;
  let submittingForm: string | null = null;

  const originNow = (): EventOrigin =>
    isDevtoolsAction() ? 'devtools' : userActive ? 'user' : 'code';

  function recordFormEvent(input: FormEvent, infer = true) {
    const event: FormEvent = { ...input, seq: ++eventSeq };
    if (infer) event.origin ??= originNow();
    const key = `${event.formId}:${event.path}`;
    if (event.type === 'value') {
      const previous = lastValue.get(key);
      if (previous === event.detail) return;
      if (previous !== undefined) event.prev = previous;
      lastValue.set(key, event.detail ?? '');
    }
    if (event.type === 'status') {
      const status = event.detail?.split('→').pop()?.trim() ?? '';
      if (lastStatus.get(key) === status) return;
      lastStatus.set(key, status);
    }
    if (event.type === 'value') {
      for (let i = formEvents.length - 1; i >= Math.max(0, formEvents.length - 6); i--) {
        const earlier = formEvents[i];
        if (earlier.formId !== event.formId || earlier.path !== event.path) break;
        if (earlier.type !== 'value') continue;
        if (earlier.origin !== event.origin || event.timestamp - earlier.timestamp > MERGE_MS)
          break;
        formEvents.splice(i, 1);
        formEvents.push({ ...event, prev: earlier.prev, count: (earlier.count ?? 1) + 1 });
        return;
      }
    }
    formEvents.push(event);
    if (formEvents.length > MAX_FORM_EVENTS) {
      formEvents.splice(0, formEvents.length - MAX_FORM_EVENTS);
    }
  }

  function seedStatuses(formId: string, node: FormFieldNode) {
    lastStatus.set(`${formId}:${node.path}`, node.status);
    if (node.type === 'control') lastValue.set(`${formId}:${node.path}`, detailOf(node.value));
    for (const child of node.children ?? []) seedStatuses(formId, child);
  }

  function watchRoots(found: FoundForm[]) {
    const live = new Set<object>();
    for (const form of found) {
      if (form.kind === 'signal') {
        wrapSignalSubmit(form);
        continue;
      }
      live.add(form.root);
      if (watched.has(form.root)) continue;
      const formId = idOf(form.root);
      const stop = watchControlEvents(
        form.root,
        formId,
        (event) => {
          if (event.type !== 'touched' && event.type !== 'dirty') recordFormEvent(event);
          schedulePush();
        },
        {
          elements: () => fieldElements,
          rootKey: form.property ?? propertyHolding(form) ?? '',
          submitted: () => form.directive?.['submitted'],
        },
      );
      if (!stop) continue;
      watched.set(form.root, { formId, stop });
      seedStatuses(formId, serializeControl(form.root, fieldElements));
    }
    for (const [root, { formId, stop }] of watched) {
      if (live.has(root)) continue;
      stop();
      watched.delete(root);
      for (const map of [lastStatus, lastValue, pendingSince]) {
        for (const key of map.keys()) {
          if (key.startsWith(`${formId}:`)) map.delete(key);
        }
      }
    }
  }

  function wrapSignalSubmit(form: FoundForm) {
    const flag = read(() => form.root['submitState']['selfSubmitting'] as AnyRecord, null);
    if (!flag || wrappedSubmits.has(flag) || typeof flag['set'] !== 'function') return;
    wrappedSubmits.add(flag);
    const formId = idOf(form.root);
    const original = flag['set'];
    unwrapSubmits.push(() => {
      flag['set'] = original;
      wrappedSubmits.delete(flag);
    });
    let started = false;
    flag['set'] = function (this: unknown, value: boolean) {
      const result = original.call(this, value);
      if (value) {
        started = true;
        submittingForm = formId;
        recordFormEvent({
          formId,
          path: '',
          type: 'submit',
          outcome: 'ran',
          timestamp: Date.now(),
        });
      } else {
        if (!started) {
          recordFormEvent({
            formId,
            path: '',
            type: 'submit',
            outcome: 'blocked',
            detail: 'invalid, so the action did not run',
            timestamp: Date.now(),
          });
        }
        started = false;
        if (submittingForm === formId) setTimeout(() => (submittingForm = null), 0);
      }
      schedulePush();
      return result;
    };
  }

  function stampPending(formId: string, node: FormFieldNode, now: number) {
    const key = `${formId}:${node.path}`;
    if (node.status === 'PENDING') {
      if (!pendingSince.has(key)) pendingSince.set(key, now);
      node.pendingSince = pendingSince.get(key);
    } else pendingSince.delete(key);
    for (const child of node.children ?? []) stampPending(formId, child, now);
  }

  async function pushForms() {
    try {
      const ng = getNg();
      if (!ng?.getDirectives) return;
      const found = findForms(ng, document.querySelectorAll('*'));
      foundById = new Map(found.forms.map((form) => [idOf(form.root), form]));
      fieldElements = found.elements;
      watchRoots(found.forms);
      const forms = collectForms(found, idOf);
      const now = Date.now();
      for (const form of forms) stampPending(form.id, form.root, now);
      const streamed = new Set(Array.from(watched.values(), ({ formId }) => formId));
      for (const event of diffForms(lastForms, forms)) {
        if (!streamed.has(event.formId) || DIFFED_FOR_ALL.includes(event.type)) {
          const origin: EventOrigin | undefined = devtoolsSincePush
            ? 'devtools'
            : userSincePush
              ? 'user'
              : undefined;
          recordFormEvent(origin ? { ...event, origin } : event, false);
        }
      }
      lastForms = forms;
      userSincePush = false;
      devtoolsSincePush = false;
      const report = { pageId, forms, events: formEvents, setupErrors };
      const payload = JSON.stringify(report);
      if (payload === lastPayload && now - lastPushAt < HEARTBEAT_MS) return;
      lastPayload = payload;
      lastPushAt = now;
      await my.rpc.call('push-forms', report);
    } catch {
      return;
    }
  }

  function schedulePush() {
    if (pushTimer) return;
    pushTimer = setTimeout(() => {
      pushTimer = undefined;
      void pushForms();
    }, PUSH_DELAY_MS);
  }

  const onUserEvent = (event: Event) => {
    if (!isDevtoolsAction()) userSincePush = true;
    userActive = true;
    clearTimeout(userTimer);
    userTimer = setTimeout(() => (userActive = false), 0);
    if (event.type === 'submit') onSubmit(event);
    if (event.type !== 'click' && event.type !== 'keydown') schedulePush();
  };

  function onSubmit(event: Event) {
    const target = event.target;
    for (const [formId, form] of foundById) {
      if (form.formElement !== target || form.kind === 'signal') continue;
      const status = String(read(() => form.root['status'], ''));
      setTimeout(() => {
        afterPaint(() => {
          const focus = describeElement(document.activeElement);
          recordFormEvent({
            formId,
            path: '',
            type: 'submit',
            outcome: 'ran',
            detail: `status ${status} at submit${focus ? `, focus on ${focus}` : ''}`,
            origin: isDevtoolsAction() ? 'devtools' : 'user',
            timestamp: Date.now(),
          });
          schedulePush();
        });
      }, 0);
    }
  }

  const onRejection = (event: PromiseRejectionEvent) => {
    if (!submittingForm) return;
    recordFormEvent({
      formId: submittingForm,
      path: '',
      type: 'submit',
      outcome: 'threw',
      detail: redactMessage(String(event.reason?.message ?? event.reason ?? 'error')).slice(0, 200),
      timestamp: Date.now(),
    });
    schedulePush();
  };

  for (const type of USER_EVENTS) document.addEventListener(type, onUserEvent, true);
  addEventListener('unhandledrejection', onRejection);

  const originalError = console.error;
  const patchedError = function (this: unknown, ...args: unknown[]) {
    const setup = read(() => setupErrorOf(args), null);
    if (setup && !setupErrors.includes(setup)) {
      setupErrors.push(setup);
      if (setupErrors.length > MAX_SETUP_ERRORS) setupErrors.shift();
      schedulePush();
    }
    return originalError.apply(this, args as []);
  };
  console.error = patchedError;

  my.rpc.register({
    name: 'highlight-form-field',
    type: 'event',
    jsonSerializable: true,
    handler: (target: { formId: string; path: string } | null) => {
      highlight.clear();
      const ng = getNg();
      if (!isFieldTarget(target) || !ng?.getDirectives) return;
      const found = foundById.get(target.formId);
      if (!found) return;
      try {
        const el = findFieldElement(
          ng,
          document.querySelectorAll('*'),
          found,
          target.path,
          fieldElements,
        );
        if (el instanceof HTMLElement) highlight.show(el);
      } catch {
        return;
      }
    },
  });

  my.rpc.register({
    name: 'form-action',
    type: 'event',
    jsonSerializable: true,
    handler: (message: { requestId?: string; pageId?: string; request?: unknown }) => {
      if (!message || typeof message.requestId !== 'string') return;
      if (message.pageId && message.pageId !== pageId) return;
      const respond = (result: unknown) =>
        void my.rpc
          .call('form-action-result', { requestId: message.requestId, pageId, result })
          .catch(() => {});
      const ng = getNg();
      if (!ng?.getDirectives)
        return respond({
          ok: false,
          error: 'This page has no Angular debug API (production build?).',
        });
      if (!isFormAction(message.request))
        return respond({ ok: false, error: 'Unknown form action.' });
      const request = message.request;
      if (request.formId && !foundById.has(request.formId) && request.action !== 'locate') return;
      if (!request.formId && !foundById.size && request.action !== 'locate') return;
      if (request.action === 'locate') {
        let el: Element | null = null;
        try {
          el = request.selector ? document.querySelector(request.selector) : null;
        } catch {
          el = null;
        }
        if (!el) return;
      }
      devtoolsSincePush = true;
      runFormAction(
        {
          ng,
          forms: foundById,
          elements: fieldElements,
          all: () => document.querySelectorAll('*'),
        },
        request,
      ).then(
        (result) => {
          respond(result);
          void pushForms();
        },
        (error) => respond({ ok: false, error: String((error as Error)?.message ?? error) }),
      );
    },
  });

  return {
    push: () => void pushForms(),
    stop() {
      clearTimeout(pushTimer);
      clearTimeout(userTimer);
      for (const type of USER_EVENTS) document.removeEventListener(type, onUserEvent, true);
      removeEventListener('unhandledrejection', onRejection);
      if (console.error === patchedError) console.error = originalError;
      for (const { stop } of watched.values()) stop();
      watched.clear();
      for (const unwrap of unwrapSubmits.splice(0)) unwrap();
    },
  };
}
