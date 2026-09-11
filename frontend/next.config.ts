import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: [
    '@coinbase/cdp-sdk',
    '@base-org/account',
    '@x402/core',
    '@x402/evm',
    '@x402/svm',
  ],
};

export default nextConfig;
