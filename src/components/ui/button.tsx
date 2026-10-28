import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * One button, two weights of emphasis.
 *
 * `primary` is the single thing on a screen asking to be acted on; `quiet` is
 * everything else. A third emphasis would mean the screen has two primary
 * actions, which is a screen problem, not a button problem.
 */

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
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    variants: {
      emphasis: {
        primary: { backgroundColor: theme.colors.accent },
        quiet: {
          backgroundColor: theme.colors.soft,
          borderColor: theme.colors.line,
          borderWidth: 1,
        },
      },
    },
  },
  label: {
    fontFamily: theme.typography.family.medium,
    variants: {
      emphasis: {
        primary: { color: theme.colors.surf },
        quiet: { color: theme.colors.ink },
      },
    },
  },
}));
