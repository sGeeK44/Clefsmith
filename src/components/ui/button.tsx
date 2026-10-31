import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * One button, two weights of emphasis.
 *
 * `primary` is the single thing on a screen asking to be acted on; `quiet` is
 * everything else. A third emphasis would mean the screen has two primary
 * actions, which is a screen problem, not a button problem.
 *
 * A primary button is **ink**, not accent. Accent is the colour that points at
 * something — an overline, a study that has just opened, the note being read —
 * and a screen whose only button already wears it has nothing left to point
 * with. Ink is the strongest fill the palette has, which is what a single
 * primary action wants anyway.
 */

/**
 * The two heights the mockup draws, in points.
 *
 * They are written here rather than as tokens because nothing else in the
 * application is a button: a `BUTTON` in the spacing scale would be a size one
 * component uses and every other one could reach for.
 */
const PRIMARY = 56;
const QUIET = 50;

type Emphasis = 'primary' | 'quiet';

export function Button({
  label,
  emphasis = 'primary',
  ...rest
}: PressableProps & { readonly label: string; readonly emphasis?: Emphasis }) {
  styles.useVariants({ emphasis });

  return (
    <Pressable accessibilityRole="button" style={styles.button} {...rest}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: 'center',
    borderRadius: theme.radii.l,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
    variants: {
      emphasis: {
        primary: { backgroundColor: theme.colors.ink, height: PRIMARY },
        quiet: {
          backgroundColor: theme.colors.soft,
          borderColor: theme.colors.line,
          borderWidth: 1,
          height: QUIET,
        },
      },
    },
  },
  label: {
    fontFamily: theme.typography.family.medium,
    variants: {
      emphasis: {
        primary: { color: theme.colors.bg },
        quiet: { color: theme.colors.ink },
      },
    },
  },
}));
