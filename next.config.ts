import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true, // ✅ SSR/Minify/DisplayName 등을 SWC가 처리
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "1.254.24.170",
        port: "24828",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
