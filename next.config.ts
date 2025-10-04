// /next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const baseConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(baseConfig);