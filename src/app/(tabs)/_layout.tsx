import { Tabs } from 'expo-router/js-tabs';
import { useUnistyles } from 'react-native-unistyles';

/**
 * The three tabs, and the only screens that show them.
 *
 * They are a route group inside the root stack rather than the stack itself, so
 * every screen pushed on top of them — a session, an exercise, a report — hides
 * them without any screen having to ask.
 *
 * The bar is the router's own: it already knows the safe area, the active route
 * and the platform's gestures. Only its colours are ours, which is why the
 * theme is read here and handed over as options rather than styled in place.
 */
export default function TabsLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontFamily: theme.typography.family.medium },
        tabBarStyle: { backgroundColor: theme.colors.surf, borderTopColor: theme.colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Pupitre', tabBarButtonTestID: 'tab-desk' }} />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progrès', tabBarButtonTestID: 'tab-progress' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Réglages', tabBarButtonTestID: 'tab-settings' }}
      />
    </Tabs>
  );
}
