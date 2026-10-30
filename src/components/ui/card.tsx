import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * A raised surface: the only component that knows what "raised" looks like.
 *
 * `fills` is for the one card a screen is built around — the staff being read —
 * which takes the height left over instead of the height of what is in it.
 */
export function Card({
  children,
  fills = false,
}: {
  readonly children: ReactNode;
  readonly fills?: boolean;
}) {
  styles.useVariants({ fills });

  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surf,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    variants: {
      fills: {
        true: { flex: 1 },
        false: {},
      },
    },
  },
}));
