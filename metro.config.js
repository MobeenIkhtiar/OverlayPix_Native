const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
    resolver: {
        // Add asset extensions needed by Skia
        assetExts: [
            ...getDefaultConfig(__dirname).resolver.assetExts,
            'obj', 'mtl', 'jpg', 'jpeg', 'png', 'gif', 'glb', 'gltf', 'wasm'
        ],
        sourceExts: [
            ...getDefaultConfig(__dirname).resolver.sourceExts,
            'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'
        ],
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);