import { describe, expect, it } from 'bun:test';

/**
 * The assembly is read as text rather than built.
 *
 * Building it means importing the Expo adapters it binds, and those load native
 * modules no test runner has. What is at stake here is not what the container
 * returns but how each binding is declared, and that is in the source.
 */
const assembly = await Bun.file(new URL('container.ts', import.meta.url)).text();

/** `.toResolvedValue(…)` up to the end of its statement. */
const RESOLVED = /\.toResolvedValue\([^;]*;/g;

describe('the container', () => {
  it('hands the same instance back to every caller of a resolved use case', () => {
    const transient = (assembly.match(RESOLVED) ?? []).filter(
      (binding) => !binding.includes('.inSingletonScope()'),
    );

    expect(transient).toEqual([]);
  });
});
