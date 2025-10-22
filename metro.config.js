const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure shared package can be resolved
config.resolver.extraNodeModules = {
  '@courtster/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

// Support for workspace: protocol in pnpm
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @courtster/shared imports
  if (moduleName === '@courtster/shared') {
    return {
      filePath: path.resolve(workspaceRoot, 'packages/shared/index.ts'),
      type: 'sourceFile',
    };
  }

  if (moduleName.startsWith('@courtster/shared/')) {
    const subpath = moduleName.replace('@courtster/shared/', '');
    return {
      filePath: path.resolve(workspaceRoot, 'packages/shared', subpath),
      type: 'sourceFile',
    };
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
