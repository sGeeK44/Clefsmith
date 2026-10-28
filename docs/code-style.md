# Code style

The style is Biome's, configured in `biome.json` and applied by `bun run format`.
`bun run check` reads without writing and is a step of `tools/verify`, so nothing
below is a matter of taste: it either passes or the commit does not.

Two rules of the configuration are worth knowing before writing code, because they
reject work that looks fine:

- **`noUndeclaredDependencies`** — a module may only import what `package.json` declares.
  This is why the test helpers are reached through the `#test/*` subpath declared in
  `package.json` rather than through a TypeScript path alias: Biome reads `@test/…` as an
  npm scope and refuses it.
- **`noConsole`** — only `console.error` and `console.warn`. `bench/` and `e2e/scripts/`
  are excepted in the overrides, being command-line tools whose output is the point.

## Imports

Inside `src/`, internal modules are imported through the `@/` alias — `@/domain/latency`,
never `../domain/latency`.

**Checked** by `biome-plugins/no-outward-relative-import.grit`, scoped to `src/`. A
relative path that climbs out of its own folder hides which layer it reaches, and survives
a move that should have broken it. A relative import inside the same folder is allowed and
is what `bench/` and `tools/` use, being outside the alias.

## Module mocks

`mock.module` may only appear in `test/preload.ts`.

**Checked** by `biome-plugins/no-mock-module.grit`. Applied from a test file, `mock.module`
only takes effect when the target module has not been imported yet, which makes the result
depend on test ordering.

## Comments

A comment says **why**, never what. Code that needs a comment to say what it does is code
that needs a name instead.

**Not checked by anything.** It is a convention, held up at review.

## Dead code

`bun run deadcode` (knip, configured in `knip.jsonc`) refuses an unused file, export or
dependency, and is a step of `tools/verify`. A file nothing reaches — a bench entry point,
a Cucumber step definition — is declared as an entry in `knip.jsonc`, with the reason it
is unreachable.

## Language

English everywhere in this repository: code, comments, commit messages, documentation.
The Linear tickets of the `CLE` team are French. See `CLAUDE.md`.

**Not checked by anything.**
