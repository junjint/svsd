// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

/* Bencho sounds are git-ignored (docs/SPEC.md §6.4). Until
   `npm run bencho:sounds` has generated the registry, resolve it to an
   empty module so a fresh clone still bundles — just without sound. */
const SOUND_REGISTRY = path.join(__dirname, 'src/services/sound/registry.generated.ts');
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === './registry.generated' && !fs.existsSync(SOUND_REGISTRY)) {
    return { type: 'empty' };
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
