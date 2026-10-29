// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * The speech corpus is bundled as assets, and Metro only treats a file as an
 * asset if its extension is on this list. Without `wav` it tries to parse the
 * recordings as JavaScript, and the bundle fails on the first one.
 */
config.resolver.assetExts.push('wav');

module.exports = config;
