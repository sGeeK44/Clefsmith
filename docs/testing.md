# Testing

## Where a test goes

Next to what it tests: `src/domain/latency.test.ts` sits beside `src/domain/latency.ts`.
There is no mirror tree to keep in sync, and a file moved takes its test with it.

A test belongs to the layer that owns the rule. A rule of the domain is tested in
`src/domain`, through the domain, with no adapter and no renderer in sight — the
architecture rules keep React and Expo out of the inner layers precisely so those tests
run in plain Bun. Testing that same rule through a screen tests the screen.

`bun test` runs them all and is a step of `tools/verify`.

## Fakes over mocks

A test gives a use case a fake implementation of the port it declares — a hand-written
object that honours the contract. `test/speech-bench.ts` is one, shared through the
`#test/*` subpath declared in `package.json`.

A fake that drifts from the contract makes the test pass while production fails, so a fake
is written to the port's rules, not to the test's convenience.

Module mocks are a last resort and may only be registered in `test/preload.ts`
(**checked** by `biome-plugins/no-mock-module.grit`, see `docs/code-style.md`).

## Prove the test can fail

A test is only evidence if it can fail. Before trusting one, break what it covers — change
the rule, flip the comparison, delete the guard — and watch that test, and ideally only
that test, go red. Then put the code back.

This is how a vacuous test gets caught: the fenced-block test of the reference checker
passed against a deliberately broken extractor, because the markdown it fed held no code
span inside the fence. Asserting the behaviour is not the same as observing it.

**Not checked by anything.** No mutation tool runs here; it is a discipline held up at
review.

## The e2e suite

`e2e/` is a separate package: WebdriverIO, Appium and Cucumber, features in
`e2e/features/`, run with `bun run e2e`. It installs its own dependencies so they cannot
shift what the application resolves. `e2e/README.md` says how to run it locally.

It is **not** part of `tools/verify`: building a binary and booting a simulator is not
something a commit waits for. In CI it runs on the release pull request and nowhere else —
see the comment at the top of `.github/workflows/e2e.yml`, which explains why the workflow
still triggers everywhere while its jobs stand down.

## The bench is not a test suite

`bench/` measures; it does not assert. It publishes figures a human reads.
`tools/bench-reproducible` is the part of it that behaves like a test: it refuses a bench
whose figures move on their own. See `docs/architecture.md`.
