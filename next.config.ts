import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/tibiadic",
  assetPrefix: "/tibiadic/",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/tibiadic",
  },
};

export default nextConfig;