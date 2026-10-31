/**
 * Reads a text into one of a declared few, or says it is none of them.
 *
 * Whatever arrives from outside — a route parameter, a stored record — is a
 * string, and the types it has to become are unions built from `as const`
 * lists. Casting the string instead lets a value nothing declared travel
 * inwards, where it is read as an index and the lookup comes back undefined:
 * the failure then surfaces far from the text that caused it, as a crash rather
 * than as a refusal.
 */
export function oneOf<T extends string | number>(
  few: readonly T[],
  text: string | undefined,
): T | undefined {
  if (text === undefined) {
    return undefined;
  }

  return few.find((member) =>
    typeof member === 'number' ? isNumbered(member, text) : member === text,
  );
}

/**
 * `Number` alone would accept whitespace and `0x10`, and `parseFloat` would
 * accept anything that merely starts with a number — so the text has to spell
 * the value it claims and nothing else.
 */
function isNumbered(member: number, text: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(text) && Number(text) === member;
}
