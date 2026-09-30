import {
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { requestCode, submitCode, type CodeResult, type TrustClient } from '../auth';

const ERRORS: Record<Exclude<CodeResult, 'trusted'>, string> = {
  empty: 'Enter the code from the terminal.',
  wrong: 'That code did not work. Check the terminal for the current code and try again.',
  unreachable:
    "Can't reach the devtools server. Check that the dev server is running, then try again.",
};

@Component({
  selector: 'app-code-entry',
  template: `
    <section aria-labelledby="code-entry-title">
      <h2 id="code-entry-title">Enter the one-time code</h2>
      <p>
        The devtools server at <code>{{ server() }}</code> asks for a one-time code before it shares
        data with this panel.
      </p>
      <p class="hint">
        Find the 6-digit <strong>auth code</strong> in the terminal that runs your dev server. A
        code lasts 5 minutes and changes after 5 wrong tries.
      </p>
      <form (submit)="submit($event)" novalidate>
        <label for="code-entry-input">One-time code</label>
        <div class="row">
          <input
            #field
            id="code-entry-input"
            name="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            spellcheck="false"
            maxlength="16"
            [value]="code()"
            (input)="code.set(field.value)"
            [attr.aria-invalid]="error() ? 'true' : null"
            aria-describedby="code-entry-error"
          />
          <button type="submit" [disabled]="busy()">{{ busy() ? 'Checking…' : 'Connect' }}</button>
        </div>
        <p id="code-entry-error" class="error" role="alert">{{ error() }}</p>
      </form>
      <div class="more">
        <button type="button" class="ghost" [disabled]="busy()" (click)="newCode()">
          Print a new code
        </button>
        <p class="note" role="status">{{ note() }}</p>
      </div>
    </section>
  `,
  styles: `
    @use 'mixins' as m;

    :host {
      display: block;
    }
    section {
      @include m.panel;
      @include m.enter;
      display: grid;
      gap: 12px;
      max-width: 520px;
      padding: 20px;
    }
    h2 {
      margin: 0;
      color: var(--text-strong);
      font-size: 16px;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: var(--text);
      line-height: 1.5;
    }
    .hint {
      color: var(--text-2);
    }
    code {
      font-family: var(--font-mono);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    form {
      display: grid;
      gap: 6px;
    }
    label {
      color: var(--text-2);
      font-size: 12px;
      font-weight: 500;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    input {
      flex: 1 1 160px;
      min-width: 0;
      height: var(--control-h);
      padding: 0 10px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--bg);
      color: var(--text-strong);
      font-family: var(--font-mono);
      font-size: 15px;
      letter-spacing: 0.2em;
      transition:
        border-color 0.2s var(--ease),
        box-shadow 0.2s var(--ease);
    }
    input:hover {
      border-color: color-mix(in srgb, var(--border-strong) 60%, var(--text-3));
    }
    input:focus-visible {
      @include m.field-focus;
    }
    input[aria-invalid='true'] {
      border-color: color-mix(in srgb, var(--danger) 60%, transparent);
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--control-h);
      padding: 0 14px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      color: var(--text);
      font: inherit;
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color 0.2s var(--ease),
        border-color 0.2s var(--ease);
    }
    button:focus-visible {
      @include m.focus-ring;
    }
    button[type='submit'] {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 600;
    }
    button[type='submit']:hover:not(:disabled) {
      border-color: var(--accent-hover);
      background: var(--accent-hover);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button.ghost {
      border-color: transparent;
      background: none;
      color: var(--text-2);
    }
    button.ghost:hover:not(:disabled) {
      border-color: var(--border);
      background: var(--surface-2);
      color: var(--text);
    }
    .error {
      color: var(--danger);
      font-size: 12px;
    }
    .more {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
    }
    .note {
      color: var(--text-2);
      font-size: 12px;
    }
  `,
})
export class CodeEntry implements OnInit {
  readonly client = input.required<TrustClient>();
  readonly server = input.required<string>();
  readonly pageOrigin = input.required<string>();

  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly note = signal('');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterNextRender(() => this.field().nativeElement.focus());
  }

  ngOnInit() {
    void requestCode(this.client());
  }

  protected async submit(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.busy.set(true);
    this.note.set('');
    const result = await submitCode(this.client(), this.code(), this.server(), this.pageOrigin());
    this.busy.set(false);
    if (result === 'trusted') {
      this.error.set('');
      return;
    }
    this.error.set(ERRORS[result]);
    const field = this.field().nativeElement;
    field.focus();
    field.select();
  }

  protected async newCode() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.note.set('');
    let printed: boolean;
    try {
      printed = await requestCode(this.client(), true);
    } finally {
      this.busy.set(false);
    }
    if (printed) {
      this.code.set('');
      this.note.set('A new code is in the terminal.');
      this.field().nativeElement.focus();
    } else {
      this.error.set(ERRORS.unreachable);
    }
  }
}
