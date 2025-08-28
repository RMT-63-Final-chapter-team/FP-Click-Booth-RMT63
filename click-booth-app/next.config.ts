import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "res.cloudinary.com",
      "i.ibb.co",
      "i.ibb.co.com",
      "icons.veryicon.com",
      "cdn-icons-png.freepik.com",
      "img.icons8.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // izinkan semua path di host ini
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "icons.veryicon.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.freepik.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
        pathname: "/**",
      },
      // Tambahan untuk domain umum yang mungkin digunakan
      {
        protocol: "https",
        hostname: "*.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.freepik.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.icons8.com",
        pathname: "/**",
      },
    ],
  },
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
  // Additional config for better chunk loading
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Webpack fallback for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Development configuration to suppress certain warnings
  reactStrictMode: true,
};

export default nextConfig;
