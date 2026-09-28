---
title: Forms
description: Every form on the page with each field's state and errors, a change timeline, submit explanations and a lint.
---

# Forms

The Forms tab and the forms tools read Signal Forms, reactive forms and template-driven forms from the running page, in development builds only. Signal Forms need Angular 21 or later. The live change timeline for reactive and template-driven forms uses `control.events` (Angular 18+); on Angular 17 changes are picked up every few seconds instead, without submit and reset events.

## Where the data comes from

The [overlay](/getting-started/overlay) finds the forms on the page and sends their state. Form actions (touch, reset, submit and others) are sent back to the page and run there. The server adds the source file and line of each form and its rules.

## Forms list

The sidebar lists each form with its label, kind (**Signal Forms**, **Reactive** or **Template-driven**) and error count. Check **All pages** to include forms from other open tabs.

Select a form to see its status, dirty and touched state, whether it was submitted or is submitting, and an error summary.

## Fields

Each field shows its value, status, touched/dirty state and errors, plus:

- For Signal Forms: constraints (`min`, `max`, `minLength`, `maxLength`, `pattern`), a pending `debounce`, `submitting`, and disabled reasons.
- For reactive and template-driven forms: whether validators and async validators are attached, the value `reset()` goes back to, `updateOn`, and the bound `ControlValueAccessor`.

Filter by path, or with the **Invalid**, **Dirty**, **Touched**, **Disabled** and **Error not shown** chips. Hover a field to highlight its input in the page. Click it for field details, where you can set a value, focus, touch or revalidate the field, or store it as a global (`$form` in the page console).

Each error says where it comes from: a validator, a template attribute, a cross-field rule (and on which ancestor), async, parse, a server/submission error, or `setErrors()`.

## Actions

The actions bar works on the selected form:

- **Touch all**, **Revalidate**, **Focus first invalid** and **Pick field on page**.
- **Snapshot** saves the form's values. **Restore** puts them back.
- **Reset** and **Submit**.

Restore, reset and submit ask for confirmation first. Secret fields are never written.

## Views

The Forms tab has four views:

- **Fields**: the field table with filters and per-field actions.
- **Timeline**: recent changes, each tagged with its origin (user, code or devtools). Check **Record details** to add the calling code of each change, validator changes, async validation times and component renders per keystroke. Array items are tracked by identity, so moves show as moves.
- **Submit**: what submit will do and why it might do nothing, plus what the form sends. **Copy test fixture** copies a fixture for your tests.
- **Lint**: form bugs and model-aware accessibility checks. For generic accessibility checks, run axe on the page.

Pick a field on the page to select it, or open a form from its component in the [Components tab](/inspectors/components).

## For agents

`ng-devtools:explain-form-invalid` is the tool to reach for first: without arguments it lists every form that is invalid or waiting on async validation, with each failing field's current value, the validator that failed, its message and whether it was touched. Pass `form` (an id like `Checkout.form@ab12`, or part of a label like `Checkout.form`) to explain one form.

- `ng-devtools:inspect-forms` lists the forms with their status and error counts. Pass `form` for a field tree, plus `path` (e.g. `address.city`), `onlyInvalid` or `includeValues: false` to narrow it down.
- Both tools note when the page last reported, so an agent can tell when the data is stale.
- `ng-devtools:explain-field` adds why validation is skipped (hidden, disabled, readonly), typed-but-uncommitted values (`updateOn`, `debounce`), stale validity after validator changes, the binding, whether the error text is visible, and the file and line of the form and its rules.
- Agents can loop: inspect, act (`form-action`, `fill-form`), `wait-for-form`, then `form-diff` from the marker they had. Writes need a development build; `reset`, `submit` and `restore` need `confirm: true`.

See [Tools](/agents/tools) for the full list.

## Privacy

Form values leave the page: they are sent to the devtools server, shown in the Forms tab and returned to agents. Password fields and fields with secret-looking names are replaced with `[redacted]`. See [Security](/security) for the full rules and how to mask or unmask a field.
