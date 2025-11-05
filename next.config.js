/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    // Suppress benign SWC platform warnings on Windows (missing optional platform packages)
    const ignore = config.ignoreWarnings || [];
    ignore.push(/snapshot\.managedPaths option/);
    config.ignoreWarnings = ignore;
    return config;
  },
}

module.exports = nextConfig

