import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  webpack: (config) => {
    // Force the builder to ignore native ONNX runtime binaries
    config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
    };
    return config;
  },
};

export default withPWA(withNextIntl(nextConfig));
