---
title: Injectors
description: The injector hierarchy, token lookup paths and the providers at each level.
---

# Injectors

Every component and directive gets an injector. When it asks for a token, Angular walks up this tree, then through the environment injectors, until something provides it. The Injectors tab shows that tree.

## Where the data comes from

- **Live**: the [overlay](/getting-started/overlay) reads the injector tree from Angular's debug API. This needs Angular 17 or later and a development build.
- **Source**: without a live tree, the tab lists DI found in your files, grouped as **Root Providers (provide\*)**, **Injectable Services**, **inject() Calls** and **Component Providers**.

## The tree

Switch between **Elements** (component and directive injectors) and **Environment** (the environment injectors, such as the root injector).

- Search for a token, component or injector. A match shows **Provided by** chips; click one to jump to that injector.
- **Components only** hides directive injectors. It is on by default.
- **With providers** hides injectors that provide nothing.
- Hover an element injector to highlight its element in the page.

## Details

Select an injector to see:

- **Lookup path**: the injectors Angular asks, in order, until one has the token. The path ends at the null injector, which throws `NullInjectorError`. Click any step to open it.
- **Injected here** (element injectors): each token requested at this level, the directive that asked for it, and the injector that answered, or **not provided anywhere**.
- **Provides**: each provider with its kind (`useClass`, `useValue`, `useFactory` or `useExisting`), and whether it is a view provider or a multi provider. Providers that come from imported modules show the import path.

## For agents

- `ng-devtools:get-providers` lists DI providers from source.
- `ng-devtools:inspect-providers` returns the injector tree a page reported.
- The `ng-devtools:injector-tree` resource holds the live tree.

## Tips

- If a token throws `NullInjectorError`, search for it and read the lookup path of the component that asks for it.
- The tree shows up to 2000 injectors.
