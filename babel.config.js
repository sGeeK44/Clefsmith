// Unistyles rewrites the components it styles at compile time, so its Babel
// plugin is not optional: without it a themed component renders with no style
// at all. Expo generates no Babel config of its own, which is why this file
// exists.
module.exports = (api) => {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
  };
};
