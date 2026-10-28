/**
 * Regenerates the frozen Bravura table.
 *
 *   curl -sLO https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist/Bravura.json
 *   curl -sLO https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata/glyphnames.json
 *   bun tools/smufl/extract.ts Bravura.json glyphnames.json > src/domain/score/bravura.ts
 *
 * The two inputs are the canonical ones and are not committed: together they weigh
 * more than the whole application, and nothing at run time reads them.
 */
import { readFileSync } from 'node:fs';

import type { Glyphs } from '@/domain/score/glyph';
import { type FontMetadata, type GlyphNames, glyphOf } from './metadata';

const GLYPHS = ['gClef', 'fClef', 'noteheadBlack'] as const;

/** Everything else a staff is drawn with comes from the font's own defaults. */
const DEFAULTS = [
  'staffLineThickness',
  'legerLineThickness',
  'legerLineExtension',
  'stemThickness',
] as const;

const [fontPath, namesPath] = process.argv.slice(2);
if (fontPath === undefined || namesPath === undefined) {
  throw new Error('Usage: bun tools/smufl/extract.ts <font metadata> <glyph names>');
}

const font = JSON.parse(readFileSync(fontPath, 'utf8')) as FontMetadata & {
  readonly fontName: string;
  readonly fontVersion: string;
  readonly engravingDefaults: Record<string, number>;
};
const names = JSON.parse(readFileSync(namesPath, 'utf8')) as GlyphNames;

const glyphs = Object.fromEntries(
  GLYPHS.map((name) => [name, glyphOf(name, names, font)]),
) as Glyphs;
const defaults = Object.fromEntries(DEFAULTS.map((key) => [key, font.engravingDefaults[key]]));

process.stdout.write(`/**
 * ${font.fontName} ${font.fontVersion}, the numbers of it this application draws with.
 *
 * Generated — see \`tools/smufl/extract.ts\` for the command that rebuilds it. Edit
 * that, never this.
 */
import type { Glyphs } from '@/domain/score/glyph';

export const ENGRAVING_DEFAULTS = ${JSON.stringify(defaults, null, 2)} as const;

export const GLYPHS: Glyphs = ${JSON.stringify(glyphs, null, 2)};
`);
