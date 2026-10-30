import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * One fact about what is about to be played, on a fill of its own.
 *
 * Three of them sit side by side under a study, and on a plain background they
 * read as one sentence broken by spaces. The fill is what makes them count as
 * three — it is a separator the eye does not have to parse.
 */
export function Chip({ label }: { readonly label: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
  },
}));
