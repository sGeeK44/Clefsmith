import { Text as NativeText, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * The only place a font family and a type size are named.
 *
 * A screen asks for a role — a title, a caption, something muted — and never
 * for a weight or a number of points. That is what keeps the type scale a scale
 * rather than a collection of one-off decisions.
 */

type Variant = 'caption' | 'body' | 'title' | 'display';
/** Exported so that a rule deciding a tone can be written, and tested, outside a screen. */
export type Tone = 'ink' | 'muted' | 'accent' | 'ok' | 'late' | 'bad';

export function Text({
  variant = 'body',
  tone = 'ink',
  style,
  ...rest
}: TextProps & { readonly variant?: Variant; readonly tone?: Tone }) {
  styles.useVariants({ variant, tone });

  return <NativeText style={[styles.text, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: {
        caption: {
          fontSize: theme.typography.size.caption,
          fontFamily: theme.typography.family.regular,
        },
        body: { fontSize: theme.typography.size.body, fontFamily: theme.typography.family.regular },
        title: {
          fontSize: theme.typography.size.title,
          fontFamily: theme.typography.family.semibold,
        },
        display: {
          fontSize: theme.typography.size.display,
          fontFamily: theme.typography.family.bold,
        },
      },
      tone: {
        ink: { color: theme.colors.ink },
        muted: { color: theme.colors.muted },
        accent: { color: theme.colors.accent },
        ok: { color: theme.colors.ok },
        late: { color: theme.colors.late },
        bad: { color: theme.colors.bad },
      },
    },
  },
}));
