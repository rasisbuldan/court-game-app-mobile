const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// WSL2 fix: Disable file watching issues
config.resetCache = true;
config.watchFolders = [workspaceRoot];

// WSL2 fix: Use polling for file changes
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Disable caching for WSL2
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return middleware(req, res, next);
    };
  },
};

// Don't duplicate watchFolders - already set above

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
