module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  // Reanimated v4 — enables worklet-based animations on web
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
