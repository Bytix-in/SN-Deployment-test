// This file configures the build process for Vercel
module.exports = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore missing suspense boundaries
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Increase build timeout
  staticPageGenerationTimeout: 120,
  // Disable image optimization for faster builds
  images: {
    disableStaticImages: true,
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
};