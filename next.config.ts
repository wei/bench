import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "static.mlh.io-dev.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.mlh.io-dev.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.mlh.io.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.mlh.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mlhusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
