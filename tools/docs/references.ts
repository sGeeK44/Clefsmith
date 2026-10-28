/**
 * What the repository's documentation claims exists.
 *
 * Documentation rots silently: an agent that reads a rule naming a file nobody
 * kept respects it anyway, which is worse than no documentation at all. The
 * parts of a document that can be checked by a machine are the ones that name
 * something — a path, a script — and those are checked here.
 *
 * Only inline code spans are read. A path written in prose is not a reference:
 * half the sentences of a technical document contain a word with a dot in it,
 * and a checker that reads them turns every paragraph into an assertion about
 * the disk.
 */

export interface DocReference {
  readonly document: string;
  readonly line: number;
  readonly kind: 'path' | 'script';
  readonly target: string;
}

export interface Repository {
  /** Whether the repository holds this path, relative to its root. */
  readonly holds: (path: string) => boolean;
  /** The scripts `bun run` can reach. */
  readonly scripts: readonly string[];
}

const FENCE = /^\s*```/;
const CODE_SPAN = /`([^`]+)`/g;
const RUN = /^bun run ([\w:-]+)$/;

/**
 * A path, as a document is allowed to spell one: no glob, no alias, no call.
 *
 * The leading character excludes `@/domain/thing` — an import alias names a
 * module, not a file, and resolving it would need the TypeScript config this
 * checker deliberately does not read.
 */
const PATH = /^[A-Za-z0-9._][A-Za-z0-9._/-]*$/;

export function referencesIn(document: string, markdown: string): DocReference[] {
  const found: DocReference[] = [];
  let fenced = false;

  markdown.split('\n').forEach((text, index) => {
    if (FENCE.test(text)) {
      fenced = !fenced;
      return;
    }

    if (fenced) {
      return;
    }

    for (const [, span] of text.matchAll(CODE_SPAN)) {
      const reference = referenceOf(span as string);

      if (reference !== undefined) {
        found.push({ document, line: index + 1, ...reference });
      }
    }
  });

  return found;
}

/**
 * Reads one code span.
 *
 * Only the first word is considered, so that `tools/verify staged` is a
 * reference to `tools/verify` and `bun test` is a reference to nothing.
 */
function referenceOf(span: string): Pick<DocReference, 'kind' | 'target'> | undefined {
  const script = RUN.exec(span);

  if (script !== null) {
    return { kind: 'script', target: script[1] as string };
  }

  const [word] = span.split(/\s+/);

  if (word === undefined || !PATH.test(word)) {
    return undefined;
  }

  const named = word.includes('/') || /\.[A-Za-z0-9]+$/.test(word);

  return named ? { kind: 'path', target: word } : undefined;
}

export function deadReferences(
  references: readonly DocReference[],
  repository: Repository,
): DocReference[] {
  return references.filter((reference) =>
    reference.kind === 'script'
      ? !repository.scripts.includes(reference.target)
      : !repository.holds(reference.target),
  );
}
