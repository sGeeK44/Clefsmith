import { describe, expect, it } from 'bun:test';

import { deadReferences, referencesIn } from './references';

function targetsIn(markdown: string): string[] {
  return referencesIn('doc.md', markdown).map((reference) => reference.target);
}

describe('references a document makes', () => {
  it('reads a path out of a code span', () => {
    expect(referencesIn('doc.md', 'The chain lives in `tools/verify`.')).toEqual([
      { document: 'doc.md', line: 1, kind: 'path', target: 'tools/verify' },
    ]);
  });

  it('reads a script out of a bun run invocation', () => {
    expect(referencesIn('doc.md', 'Run `bun run deadcode`.')).toEqual([
      { document: 'doc.md', line: 1, kind: 'script', target: 'deadcode' },
    ]);
  });

  it('says which line made the claim', () => {
    expect(referencesIn('doc.md', 'intro\n\nsee `package.json`')[0]?.line).toBe(3);
  });

  it('keeps the path when the span spells a command with arguments', () => {
    expect(targetsIn('`tools/verify staged` runs on commit.')).toEqual(['tools/verify']);
  });

  it('ignores a path written in prose, where a dot is just a sentence ending', () => {
    expect(targetsIn('The chain lives in tools/verify. So does app.json.')).toEqual([]);
  });

  it('ignores a fenced block, which quotes documentation rather than making a claim', () => {
    const quoting = ['```md', 'Checks live in `tools/gone`.', '```', 'Really in `package.json`.'];

    expect(targetsIn(quoting.join('\n'))).toEqual(['package.json']);
  });

  it('ignores an import alias, which names a module and not a file', () => {
    expect(targetsIn('Import through `@/domain/clef`.')).toEqual([]);
  });

  it('ignores a span that names no file', () => {
    expect(targetsIn('`bun test` reads `noUndeclaredDependencies` and `Date.now()`.')).toEqual([]);
  });
});

describe('dead references', () => {
  const repository = { holds: (path: string) => path === 'tools/verify', scripts: ['test'] };

  it('keeps a path the repository does not hold', () => {
    const references = referencesIn('doc.md', '`tools/verify` and `tools/gone`');

    expect(deadReferences(references, repository).map((r) => r.target)).toEqual(['tools/gone']);
  });

  it('keeps a script nobody can run', () => {
    const references = referencesIn('doc.md', '`bun run test` and `bun run gone`');

    expect(deadReferences(references, repository).map((r) => r.target)).toEqual(['gone']);
  });
});
