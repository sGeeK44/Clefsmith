import { type ConfigPlugin, withXcodeProject } from 'expo/config-plugins';

/**
 * Automatic signing, put back into the generated Xcode project.
 *
 * `ios/` is generated and not committed, and what comes out of a prebuild
 * carries no team and no signing style — which Xcode reads as manual signing
 * and refuses to build for a device over. Patching it by hand works until the
 * next prebuild wipes it, which is what this plugin exists to stop.
 *
 * The team is read from the environment and never from a committed file: it is
 * account data, and writing one developer's team into the repository signs
 * everyone else's builds in their name. Without it the plugin writes nothing
 * and says so — the alternative is the same Xcode error as before, with its
 * cause now hidden behind a plugin that looked like it had handled it.
 */
const TEAM = 'APPLE_TEAM_ID';

export const withSigning: ConfigPlugin = (config) =>
  withXcodeProject(config, (modified) => {
    const team = process.env[TEAM];

    if (team === undefined || team === '') {
      console.warn(
        `with-signing: ${TEAM} is not set, so the Xcode project is left unsigned. Building for a device will fail until it is.`,
      );

      return modified;
    }

    const project = modified.modResults;

    project.updateBuildProperty('CODE_SIGN_STYLE', 'Automatic');
    project.updateBuildProperty('DEVELOPMENT_TEAM', team);
    project.addTargetAttribute('ProvisioningStyle', 'Automatic');
    project.addTargetAttribute('DevelopmentTeam', team);

    return modified;
  });

export default withSigning;
