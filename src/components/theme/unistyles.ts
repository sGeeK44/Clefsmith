/**
 * Hands the palettes to Unistyles, once, before anything renders.
 *
 * `adaptiveThemes` is what makes the application follow the system setting.
 * There is no theme picker: the choice already exists on the device, and a
 * second one that disagrees with it is a bug waiting to be reported.
 *
 * This module is imported for its effect, not for what it exports — the root
 * layout imports it first so that no stylesheet is built before the themes
 * exist.
 */
import { StyleSheet } from 'react-native-unistyles';

import { themes } from '@/components/theme/tokens';

type Themes = typeof themes;

declare module 'react-native-unistyles' {
  // biome-ignore lint/correctness/noUnusedVariables: declaration merging, read by the library's types
  export interface UnistylesThemes extends Themes {}
}

StyleSheet.configure({ themes, settings: { adaptiveThemes: true } });
